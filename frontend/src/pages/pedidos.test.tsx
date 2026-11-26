// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PedidosPage from './PedidosPage';
import PedidoDetallePage from './PedidoDetallePage';
import { customersApi, ordersApi } from '../services/sprint3';
import { products } from '../services/products';
import { ApiError } from '../services/http';
vi.mock('../services/sprint3', () => ({ customersApi: { list: vi.fn(), create: vi.fn() }, ordersApi: { list: vi.fn(), get: vi.fn(), create: vi.fn() } }));
vi.mock('../services/products', () => ({ products: { list: vi.fn() } }));

const catalogo = [
  { id: 1, code: 'LIB-001', name: 'El principito', description: null, price: 45, isActive: true },
  { id: 2, code: 'CUA-001', name: 'Cuaderno', description: null, price: 12.5, isActive: true },
  { id: 3, code: 'GOM-001', name: 'Goma', description: null, price: 2, isActive: false },
];
const clientes = [{ id: 1, name: 'María López', phone: '70000000', email: null }];
const pedidos = [
  { id: 2, customerId: 1, customerName: 'María López', registeredAt: '2026-11-25T14:00:00Z', status: 'InProgress', total: 90 },
  { id: 1, customerId: 1, customerName: 'María López', registeredAt: '2026-11-24T14:00:00Z', status: 'Pending', total: 12.5 },
];
const detalle = (id: number, customerId: number, customerName: string) => ({
  id, customerId, customerName, registeredAt: '2026-11-26T12:00:00Z', status: 'Pending', observations: null, total: 90,
  details: [{ id: 10, productId: 1, productCode: 'LIB-001', productName: 'El principito', quantity: 2, unitPrice: 45, subtotal: 90 }],
});

const renderLista = () => render(<MemoryRouter><PedidosPage/></MemoryRouter>);
async function abrirFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '+ Nuevo pedido' }));
  return screen.getByRole('dialog', { name: 'Registrar nuevo pedido' });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ordersApi.list).mockResolvedValue(pedidos);
  vi.mocked(customersApi.list).mockResolvedValue(clientes);
  vi.mocked(products.list).mockResolvedValue(catalogo);
});
afterEach(cleanup);

describe('Listado de pedidos', () => {
  it('muestra los pedidos guardados con su estado y permite filtrarlos', async () => {
    const user = userEvent.setup();
    renderLista();
    expect(await screen.findByText('PED-002')).toBeDefined();
    expect(screen.getByText('En proceso', { selector: '.pedido-estado' })).toBeDefined();
    expect(screen.getByText('Pendiente', { selector: '.pedido-estado' })).toBeDefined();
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'Pending');
    expect(screen.queryByText('PED-002')).toBeNull();
    expect(screen.getByText('PED-001')).toBeDefined();
  });

  it('informa si la API falla y permite reintentar', async () => {
    const user = userEvent.setup();
    vi.mocked(ordersApi.list).mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'));
    renderLista();
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('PED-002')).toBeDefined();
    expect(ordersApi.list).toHaveBeenCalledTimes(2);
  });
});

describe('Registro de pedidos', () => {
  it('registra un pedido para un cliente existente sin crear otro cliente', async () => {
    const user = userEvent.setup();
    vi.mocked(ordersApi.create).mockResolvedValue(detalle(3, 1, 'María López'));
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), '1');
    await user.click(within(form).getByRole('button', { name: '+ Agregar producto' }));
    await user.selectOptions(within(form).getByLabelText('Producto 1'), '1');
    const cantidad = within(form).getByLabelText('Cantidad 1');
    await user.clear(cantidad); await user.type(cantidad, '2');
    expect(within(form).getByText('Bs. 90.00')).toBeDefined();
    expect(within(form).queryByRole('option', { name: /Goma/ })).toBeNull();
    await user.click(within(form).getByRole('button', { name: 'Registrar pedido' }));
    expect(await screen.findByText(/Pedido PED-003 registrado para María López/)).toBeDefined();
    expect(ordersApi.create).toHaveBeenCalledWith({ customerId: 1, observations: null, details: [{ productId: 1, quantity: 2 }] });
    expect(customersApi.create).not.toHaveBeenCalled();
    expect(screen.getByText('PED-003')).toBeDefined();
  });

  it('exige al menos un producto antes de llamar a la API', async () => {
    const user = userEvent.setup();
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), '1');
    await user.click(within(form).getByRole('button', { name: 'Registrar pedido' }));
    expect(within(form).getByRole('alert').textContent).toContain('al menos un producto');
    expect(ordersApi.create).not.toHaveBeenCalled();
  });

  it('no permite repetir el nombre de un cliente ya registrado', async () => {
    const user = userEvent.setup();
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), 'nuevo');
    await user.type(within(form).getByLabelText('Nombre del cliente nuevo *'), ' maría lópez ');
    await user.click(within(form).getByRole('button', { name: '+ Agregar producto' }));
    await user.selectOptions(within(form).getByLabelText('Producto 1'), '2');
    await user.click(within(form).getByRole('button', { name: 'Registrar pedido' }));
    expect(within(form).getByRole('alert').textContent).toContain('Ya existe un cliente');
    expect(customersApi.create).not.toHaveBeenCalled();
  });

  it('crea el cliente nuevo una sola vez aunque el pedido falle y se reintente', async () => {
    const user = userEvent.setup();
    vi.mocked(customersApi.create).mockResolvedValue({ id: 7, name: 'Juan Pérez', phone: null, email: null });
    vi.mocked(ordersApi.create)
      .mockRejectedValueOnce(new ApiError('No se pudo completar la operación. Inténtalo nuevamente.', 500))
      .mockResolvedValueOnce(detalle(4, 7, 'Juan Pérez'));
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), 'nuevo');
    await user.type(within(form).getByLabelText('Nombre del cliente nuevo *'), 'Juan Pérez');
    await user.click(within(form).getByRole('button', { name: '+ Agregar producto' }));
    await user.selectOptions(within(form).getByLabelText('Producto 1'), '2');
    await user.click(within(form).getByRole('button', { name: 'Registrar pedido' }));
    expect((await within(form).findByRole('alert')).textContent).toContain('No se pudo completar');
    expect((within(form).getByLabelText('Cliente *') as HTMLSelectElement).value).toBe('7');
    await user.click(within(form).getByRole('button', { name: 'Registrar pedido' }));
    expect(await screen.findByText(/Pedido PED-004 registrado para Juan Pérez/)).toBeDefined();
    expect(customersApi.create).toHaveBeenCalledTimes(1);
    expect(customersApi.create).toHaveBeenCalledWith({ name: 'Juan Pérez', phone: null });
    expect(ordersApi.create).toHaveBeenLastCalledWith({ customerId: 7, observations: null, details: [{ productId: 2, quantity: 1 }] });
  });
});

describe('Detalle de pedido', () => {
  const renderDetalle = (id: string) => render(<MemoryRouter initialEntries={[`/orders/${id}`]}><Routes><Route path="/orders/:id" element={<PedidoDetallePage/>}/></Routes></MemoryRouter>);

  it('muestra el estado actual y los productos guardados', async () => {
    vi.mocked(ordersApi.get).mockResolvedValue({ ...detalle(5, 1, 'María López'), status: 'Delivered' });
    renderDetalle('5');
    expect(await screen.findByText('PED-005')).toBeDefined();
    expect(screen.getAllByText('Entregado').length).toBeGreaterThan(0);
    expect(screen.getByText('El principito')).toBeDefined();
    expect(ordersApi.get).toHaveBeenCalledWith('5', expect.anything());
  });

  it('distingue un pedido inexistente de una falla de conexión', async () => {
    vi.mocked(ordersApi.get).mockRejectedValueOnce(new ApiError('El pedido no existe.', 404));
    renderDetalle('99');
    expect(await screen.findByText('Pedido no encontrado')).toBeDefined();
    cleanup();
    const user = userEvent.setup();
    vi.mocked(ordersApi.get).mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.')).mockResolvedValueOnce(detalle(5, 1, 'María López'));
    renderDetalle('5');
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('PED-005')).toBeDefined();
  });
});
