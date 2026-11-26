// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MaquetaDetallePage from './MaquetaDetallePage';
import MaquetasPage from './MaquetasPage';
import { mockupsApi, customersApi } from '../services/sprint3';
import { ApiError } from '../services/http';
vi.mock('../services/sprint3', () => ({ customersApi: { list: vi.fn(), create: vi.fn() }, mockupsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), pay: vi.fn(), updateStatus: vi.fn() } }));

const solicitud = (status: string, extra = {}) => ({
  id: 5, customerId: 1, customerName: 'María López', institution: 'Colegio San Calixto', type: 'Educativa', size: 'Mediana',
  deliveryAt: '2027-03-10T19:00:00Z', observations: null, status, requestedAt: '2026-11-20T12:00:00Z', statusUpdatedAt: '2026-11-20T12:00:00Z',
  agreedPrice: 200, totalPaid: 0, pendingBalance: 200, payments: [], ...extra,
});
const renderDetalle = () => render(<MemoryRouter initialEntries={['/maquetas/5']}><Routes><Route path="/maquetas/:id" element={<MaquetaDetallePage/>}/></Routes></MemoryRouter>);
const seccionEstado = async () => screen.findByRole('region', { name: 'Estado del trabajo' });
const opcion = (seccion: HTMLElement, nombre: string | RegExp) => within(seccion).getByRole('option', { name: nombre }) as HTMLOptionElement;

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('Selector de estado de maquetas', () => {
  it('muestra el estado actual y solo habilita los estados permitidos', async () => {
    vi.mocked(mockupsApi.get).mockResolvedValue(solicitud('Requested'));
    renderDetalle();
    const seccion = await seccionEstado();
    expect(within(seccion).getByText('Pendiente', { selector: '.maqueta-estado' })).toBeDefined();
    expect(within(seccion).getByRole('listitem', { current: 'step' }).textContent).toContain('Pendiente');
    expect(opcion(seccion, 'Pendiente (actual)').disabled).toBe(true);
    expect(opcion(seccion, 'En proceso').disabled).toBe(false);
    expect(opcion(seccion, 'Cancelada').disabled).toBe(false);
    expect(opcion(seccion, 'Terminada').disabled).toBe(true);
    expect(opcion(seccion, 'Entregada').disabled).toBe(true);
  });

  it('guarda el nuevo estado en la API y muestra el estado actualizado', async () => {
    const user = userEvent.setup();
    vi.mocked(mockupsApi.get).mockResolvedValue(solicitud('Requested'));
    vi.mocked(mockupsApi.updateStatus).mockResolvedValue(solicitud('InProgress', { statusUpdatedAt: '2026-11-26T15:00:00Z' }));
    renderDetalle();
    const seccion = await seccionEstado();
    await user.selectOptions(within(seccion).getByLabelText('Cambiar estado a'), 'InProgress');
    await user.click(within(seccion).getByRole('button', { name: 'Guardar estado' }));
    expect((await within(seccion).findByRole('status')).textContent).toContain('Estado actualizado a «En proceso»');
    expect(mockupsApi.updateStatus).toHaveBeenCalledWith('5', 'InProgress');
    expect(within(seccion).getByText('En proceso', { selector: '.maqueta-estado' })).toBeDefined();
    expect(within(seccion).getByRole('listitem', { current: 'step' }).textContent).toContain('En proceso');
    expect(opcion(seccion, 'Terminada').disabled).toBe(false);
  });

  it('pide confirmación antes de cancelar y deja la solicitud en estado final', async () => {
    const user = userEvent.setup();
    vi.mocked(mockupsApi.get).mockResolvedValue(solicitud('InProgress'));
    vi.mocked(mockupsApi.updateStatus).mockResolvedValue(solicitud('Cancelled'));
    renderDetalle();
    const seccion = await seccionEstado();
    await user.selectOptions(within(seccion).getByLabelText('Cambiar estado a'), 'Cancelled');
    await user.click(within(seccion).getByRole('button', { name: 'Guardar estado' }));
    expect(within(seccion).getByRole('group', { name: 'Confirmar cancelación' })).toBeDefined();
    expect(mockupsApi.updateStatus).not.toHaveBeenCalled();
    await user.click(within(seccion).getByRole('button', { name: 'Sí, cancelar solicitud' }));
    expect(await within(seccion).findByText(/fue cancelada: su estado es final/)).toBeDefined();
    expect(mockupsApi.updateStatus).toHaveBeenCalledWith('5', 'Cancelled');
    expect(within(seccion).queryByLabelText('Cambiar estado a')).toBeNull();
  });

  it('informa si el servidor rechaza el cambio y vuelve a mostrar el estado guardado', async () => {
    const user = userEvent.setup();
    vi.mocked(mockupsApi.get).mockResolvedValueOnce(solicitud('InProgress')).mockResolvedValueOnce(solicitud('Completed'));
    vi.mocked(mockupsApi.updateStatus).mockRejectedValue(new ApiError('La transición de estado de la maqueta no es válida.', 409));
    renderDetalle();
    const seccion = await seccionEstado();
    await user.selectOptions(within(seccion).getByLabelText('Cambiar estado a'), 'Completed');
    await user.click(within(seccion).getByRole('button', { name: 'Guardar estado' }));
    expect((await within(seccion).findByRole('alert')).textContent).toContain('no es válida');
    expect(await within(seccion).findByText('Terminada', { selector: '.maqueta-estado' })).toBeDefined();
    expect(mockupsApi.get).toHaveBeenCalledTimes(2);
  });

  it('explica cuando el servidor todavía no acepta un estado', async () => {
    const user = userEvent.setup();
    vi.mocked(mockupsApi.get).mockResolvedValue(solicitud('Completed'));
    vi.mocked(mockupsApi.updateStatus).mockRejectedValue(new ApiError('The JSON value could not be converted.', 400));
    renderDetalle();
    const seccion = await seccionEstado();
    await user.selectOptions(within(seccion).getByLabelText('Cambiar estado a'), 'Delivered');
    await user.click(within(seccion).getByRole('button', { name: 'Guardar estado' }));
    expect((await within(seccion).findByRole('alert')).textContent).toContain('no aceptó el estado «Entregada»');
  });

  it('no ofrece cambios para un trabajo ya entregado', async () => {
    vi.mocked(mockupsApi.get).mockResolvedValue(solicitud('Delivered'));
    renderDetalle();
    const seccion = await seccionEstado();
    expect(within(seccion).getByText(/ya fue entregado/)).toBeDefined();
    expect(within(seccion).queryByRole('combobox')).toBeNull();
  });
});

describe('Indicadores de estado en el listado', () => {
  it('cuenta las solicitudes por estado y filtra al pulsar una tarjeta', async () => {
    const user = userEvent.setup();
    vi.mocked(customersApi.list).mockResolvedValue([]);
    vi.mocked(mockupsApi.list).mockResolvedValue([
      { ...solicitud('Completed'), id: 3 }, { ...solicitud('Completed'), id: 2 }, { ...solicitud('Cancelled'), id: 1 },
    ]);
    render(<MemoryRouter><MaquetasPage/></MemoryRouter>);
    const terminadas = await screen.findByRole('button', { name: /Terminada\s*2/ });
    expect(screen.getByRole('button', { name: /Cancelada\s*1/ })).toBeDefined();
    await user.click(terminadas);
    expect(terminadas.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('MAQ-003')).toBeDefined();
    expect(screen.queryByText('MAQ-001')).toBeNull();
  });
});
