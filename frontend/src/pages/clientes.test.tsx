// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientesPage from './ClientesPage';
import ClienteHistorialPage from './ClienteHistorialPage';
import { customersApi } from '../services/sprint3';
import { ApiError } from '../services/http';
vi.mock('../services/sprint3', () => ({ customersApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), history: vi.fn() } }));

const clientes = [
  { id: 1, name: 'María López', phone: '70000000', email: 'maria@example.com' },
  { id: 2, name: 'Colegio San Calixto', phone: null, email: 'compras@sancalixto.edu.bo' },
  { id: 3, name: 'Juan Pérez', phone: '71111111', email: null },
];
const historial = {
  customer: clientes[0],
  orders: [
    { id: 7, registeredAt: '2026-11-25T14:00:00Z', status: 'InProgress', total: 90 },
    { id: 3, registeredAt: '2026-11-20T14:00:00Z', status: 'Delivered', total: 45.5 },
  ],
  mockups: [
    { id: 4, institution: 'Colegio La Salle', type: 'Educativa', status: 'Completed', requestedAt: '2026-11-21T12:00:00Z', deliveryAt: '2026-12-05T20:30:00Z', agreedPrice: 280, totalPaid: 100, pendingBalance: 180 },
    { id: 2, institution: 'Unidad Educativa Ayacucho', type: 'Escolar', status: 'Cancelled', requestedAt: '2026-11-18T12:00:00Z', deliveryAt: '2026-11-30T20:30:00Z', agreedPrice: 90, totalPaid: 0, pendingBalance: 90 },
  ],
};
const renderHistorial = (id: string) => render(<MemoryRouter initialEntries={[`/customers/${id}`]}><Routes><Route path="/customers/:id" element={<ClienteHistorialPage/>}/></Routes></MemoryRouter>);

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('Búsqueda de clientes', () => {
  it('lista los clientes registrados y busca por nombre sin importar acentos, teléfono o correo', async () => {
    const user = userEvent.setup();
    vi.mocked(customersApi.list).mockResolvedValue(clientes);
    render(<MemoryRouter><ClientesPage/></MemoryRouter>);
    expect(await screen.findByRole('link', { name: 'Ver historial de María López' })).toBeDefined();
    expect(screen.getByText('Mostrando 3 de 3 clientes')).toBeDefined();
    const buscador = screen.getByLabelText(/Buscar por nombre/);
    await user.type(buscador, 'perez');
    expect(screen.getByRole('link', { name: 'Ver historial de Juan Pérez' })).toBeDefined();
    expect(screen.queryByText('María López')).toBeNull();
    await user.clear(buscador); await user.type(buscador, 'sancalixto');
    expect(screen.getByText('Colegio San Calixto')).toBeDefined();
    await user.clear(buscador); await user.type(buscador, 'nadie');
    expect(screen.getByText('Sin coincidencias')).toBeDefined();
  });

  it('enlaza cada cliente con su historial', async () => {
    vi.mocked(customersApi.list).mockResolvedValue(clientes);
    render(<MemoryRouter><ClientesPage/></MemoryRouter>);
    expect((await screen.findByRole('link', { name: 'Ver historial de Juan Pérez' })).getAttribute('href')).toBe('/customers/3');
  });

  it('informa si la API falla y permite reintentar', async () => {
    const user = userEvent.setup();
    vi.mocked(customersApi.list).mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.')).mockResolvedValueOnce(clientes);
    render(<MemoryRouter><ClientesPage/></MemoryRouter>);
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Mostrando 3 de 3 clientes')).toBeDefined();
  });
});

describe('Historial del cliente', () => {
  it('muestra los datos básicos, sus pedidos y sus maquetas con estado', async () => {
    vi.mocked(customersApi.history).mockResolvedValue(historial);
    renderHistorial('1');
    expect(await screen.findByRole('heading', { name: 'María López', level: 1 })).toBeDefined();
    expect(screen.getByText('70000000')).toBeDefined();
    expect(screen.getByText('maria@example.com')).toBeDefined();
    const pedidos = screen.getByRole('region', { name: /Pedidos/ });
    expect(within(pedidos).getByRole('link', { name: 'PED-007' }).getAttribute('href')).toBe('/orders/7');
    expect(within(pedidos).getByText('En proceso')).toBeDefined();
    expect(within(pedidos).getByText('Entregado')).toBeDefined();
    const maquetas = screen.getByRole('region', { name: /Trabajos de maquetas/ });
    expect(within(maquetas).getByRole('link', { name: 'MAQ-004' }).getAttribute('href')).toBe('/maquetas/4');
    expect(within(maquetas).getByText('Terminada')).toBeDefined();
    expect(within(maquetas).getByText('Cancelada')).toBeDefined();
    expect(screen.getByText('Bs. 135.50')).toBeDefined(); // total en pedidos
    expect(screen.getAllByText('Bs. 180.00').length).toBeGreaterThan(0); // saldo sin contar la maqueta cancelada
    expect(customersApi.history).toHaveBeenCalledWith('1', expect.anything());
  });

  it('muestra un estado vacío cuando el cliente no tiene solicitudes', async () => {
    vi.mocked(customersApi.history).mockResolvedValue({ customer: clientes[2], orders: [], mockups: [] });
    renderHistorial('3');
    expect(await screen.findByText('Este cliente todavía no tiene solicitudes')).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByText('Sin registrar').length).toBe(1);
  });

  it('muestra un estado vacío por sección si solo tiene pedidos', async () => {
    vi.mocked(customersApi.history).mockResolvedValue({ ...historial, mockups: [] });
    renderHistorial('1');
    expect(await screen.findByText('Este cliente no tiene trabajos de maquetas registrados.')).toBeDefined();
    expect(screen.getByText('PED-007')).toBeDefined();
  });

  it('distingue un cliente inexistente', async () => {
    vi.mocked(customersApi.history).mockRejectedValue(new ApiError('El cliente no existe.', 404));
    renderHistorial('99');
    expect(await screen.findByText('Cliente no encontrado')).toBeDefined();
  });
});
