// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MaquetasPage from './MaquetasPage';
import MaquetaDetallePage from './MaquetaDetallePage';
import { alertaEntrega } from './maquetasFormato';
import { customersApi, mockupsApi } from '../services/sprint3';
import { ApiError } from '../services/http';
vi.mock('../services/sprint3', () => ({ customersApi: { list: vi.fn(), create: vi.fn() }, mockupsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), pay: vi.fn() } }));

const anio = new Date().getFullYear() + 1;
const clientes = [{ id: 1, name: 'María López', phone: '70000000', email: null }];
const resumen = (id: number, status: string, institution: string) => ({
  id, customerId: 1, customerName: 'María López', institution, type: 'Educativa', size: 'Mediana', deliveryAt: `${anio}-03-10T19:00:00Z`,
  status, requestedAt: '2026-11-20T12:00:00Z', agreedPrice: 200, totalPaid: 0, pendingBalance: 200,
});
const detalle = (id: number, customerId: number, customerName: string) => ({
  ...resumen(id, 'Requested', 'Colegio San Calixto'), customerId, customerName, observations: null, statusUpdatedAt: '2026-11-20T12:00:00Z', payments: [],
});

const renderLista = () => render(<MemoryRouter><MaquetasPage/></MemoryRouter>);
async function abrirFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: '+ Nueva solicitud' }));
  return screen.getByRole('dialog', { name: 'Nueva solicitud de maqueta' });
}
async function completarSolicitud(user: ReturnType<typeof userEvent.setup>, form: HTMLElement, fecha = `${anio}-06-15`, hora = '15:30') {
  await user.type(within(form).getByLabelText('Institución *'), 'Colegio San Calixto');
  await user.selectOptions(within(form).getByLabelText('Tipo de maqueta *'), 'Educativa');
  await user.selectOptions(within(form).getByLabelText('Tamaño *'), 'Mediana');
  await user.type(within(form).getByLabelText('Precio acordado (Bs) *'), '200');
  fireEvent.change(within(form).getByLabelText('Fecha de entrega *'), { target: { value: fecha } });
  fireEvent.change(within(form).getByLabelText('Hora de entrega *'), { target: { value: hora } });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(mockupsApi.list).mockResolvedValue([resumen(2, 'InProgress', 'Colegio Don Bosco'), resumen(1, 'Requested', 'Unidad Educativa Ayacucho')]);
  vi.mocked(customersApi.list).mockResolvedValue(clientes);
});
afterEach(cleanup);

describe('Listado de solicitudes', () => {
  it('muestra los trabajos guardados con institución, tipo, entrega y estado', async () => {
    const user = userEvent.setup();
    renderLista();
    expect(await screen.findByText('MAQ-002')).toBeDefined();
    expect(screen.getByText('Colegio Don Bosco')).toBeDefined();
    expect(screen.getByText('En proceso', { selector: '.maqueta-estado' })).toBeDefined();
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'Requested');
    expect(screen.queryByText('MAQ-002')).toBeNull();
    expect(screen.getByText('Unidad Educativa Ayacucho')).toBeDefined();
  });

  it('informa si la API falla y permite reintentar', async () => {
    const user = userEvent.setup();
    vi.mocked(mockupsApi.list).mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'));
    renderLista();
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('MAQ-002')).toBeDefined();
  });
});

describe('Registro de solicitudes', () => {
  it('registra la solicitud de un cliente existente con fecha y hora de entrega', async () => {
    const user = userEvent.setup();
    vi.mocked(mockupsApi.create).mockResolvedValue(detalle(3, 1, 'María López'));
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), '1');
    await completarSolicitud(user, form);
    await user.click(within(form).getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByText(/Solicitud MAQ-003 registrada para María López/)).toBeDefined();
    expect(mockupsApi.create).toHaveBeenCalledWith({
      customerId: 1, institution: 'Colegio San Calixto', type: 'Educativa', size: 'Mediana',
      deliveryAt: new Date(anio, 5, 15, 15, 30).toISOString(), observations: null, agreedPrice: 200,
    });
    expect(customersApi.create).not.toHaveBeenCalled();
  });

  it('valida campos obligatorios y fechas pasadas o inexistentes', async () => {
    const user = userEvent.setup();
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), '1');
    await user.click(within(form).getByRole('button', { name: 'Registrar solicitud' }));
    expect(within(form).getByRole('alert').textContent).toContain('institución');
    await completarSolicitud(user, form, '2020-01-10', '10:00');
    await user.click(within(form).getByRole('button', { name: 'Registrar solicitud' }));
    expect(within(form).getByRole('alert').textContent).toContain('posteriores a este momento');
    // El campo de fecha descarta fechas inexistentes (31 de febrero) y queda vacío: el formulario lo exige.
    fireEvent.change(within(form).getByLabelText('Fecha de entrega *'), { target: { value: `${anio}-02-31` } });
    await user.click(within(form).getByRole('button', { name: 'Registrar solicitud' }));
    expect(within(form).getByRole('alert').textContent).toMatch(/fecha/);
    expect(mockupsApi.create).not.toHaveBeenCalled();
  });

  it('crea el cliente nuevo una sola vez aunque la solicitud falle y se reintente', async () => {
    const user = userEvent.setup();
    vi.mocked(customersApi.create).mockResolvedValue({ id: 9, name: 'Juan Pérez', phone: '71111111', email: null });
    vi.mocked(mockupsApi.create)
      .mockRejectedValueOnce(new ApiError('No se pudo completar la operación. Inténtalo nuevamente.', 500))
      .mockResolvedValueOnce(detalle(4, 9, 'Juan Pérez'));
    renderLista();
    const form = await abrirFormulario(user);
    await user.selectOptions(within(form).getByLabelText('Cliente *'), 'nuevo');
    await user.type(within(form).getByLabelText('Nombre del cliente nuevo *'), 'Juan Pérez');
    await user.type(within(form).getByLabelText('Teléfono'), '71111111');
    await completarSolicitud(user, form);
    await user.click(within(form).getByRole('button', { name: 'Registrar solicitud' }));
    expect((await within(form).findByRole('alert')).textContent).toContain('No se pudo completar');
    await user.click(within(form).getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByText(/Solicitud MAQ-004 registrada para Juan Pérez/)).toBeDefined();
    expect(customersApi.create).toHaveBeenCalledTimes(1);
    expect(customersApi.create).toHaveBeenCalledWith({ name: 'Juan Pérez', phone: '71111111' });
    expect(vi.mocked(mockupsApi.create).mock.calls[1][0]).toMatchObject({ customerId: 9 });
  });
});

describe('Detalle y avisos de entrega', () => {
  const renderDetalle = (id: string) => render(<MemoryRouter initialEntries={[`/maquetas/${id}`]}><Routes><Route path="/maquetas/:id" element={<MaquetaDetallePage/>}/></Routes></MemoryRouter>);

  it('muestra los datos guardados de la solicitud', async () => {
    vi.mocked(mockupsApi.get).mockResolvedValue(detalle(5, 1, 'María López'));
    renderDetalle('5');
    expect(await screen.findByText('MAQ-005')).toBeDefined();
    expect(screen.getByText('Colegio San Calixto')).toBeDefined();
    expect(screen.getByText('Mediana')).toBeDefined();
  });

  it('distingue una solicitud inexistente', async () => {
    vi.mocked(mockupsApi.get).mockRejectedValueOnce(new ApiError('La maqueta no existe.', 404));
    renderDetalle('99');
    expect(await screen.findByText('Solicitud no encontrada')).toBeDefined();
  });

  it('marca trabajos atrasados o por vencer, salvo los completados', () => {
    const ahora = new Date('2026-11-26T12:00:00Z');
    expect(alertaEntrega({ status: 'Requested', deliveryAt: '2026-11-25T12:00:00Z' }, ahora)?.texto).toBe('Atrasada');
    expect(alertaEntrega({ status: 'InProgress', deliveryAt: '2026-11-27T12:00:00Z' }, ahora)?.texto).toBe('Vence pronto');
    expect(alertaEntrega({ status: 'Requested', deliveryAt: '2026-12-10T12:00:00Z' }, ahora)).toBeNull();
    expect(alertaEntrega({ status: 'Completed', deliveryAt: '2026-11-25T12:00:00Z' }, ahora)).toBeNull();
  });
});
