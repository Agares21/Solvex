// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuppliersPage from './SuppliersPage';
import Compras from './components/compras/Compras';
import { suppliersApi, purchasesApi } from '../../services/purchasing';
vi.mock('../../services/purchasing', () => ({ suppliersApi: { list: vi.fn(), get: vi.fn(), create: vi.fn() }, purchasesApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), receive: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); vi.mocked(suppliersApi.list).mockResolvedValue([]); vi.mocked(purchasesApi.list).mockResolvedValue([]); });
afterEach(cleanup);
it('muestra un catálogo vacío sin proveedores inventados', async () => {
  render(<SuppliersPage/>); await screen.findByText('Todavía no hay proveedores');
  expect(screen.queryByText('Editorial Santillana')).toBeNull();
});
it('conserva los datos del formulario y muestra un código de proveedor duplicado', async () => {
  const user = userEvent.setup(); vi.mocked(suppliersApi.create).mockRejectedValue(new Error('Ya existe un proveedor con ese identificador.'));
  render(<SuppliersPage/>); await user.click(screen.getByRole('button', { name: /Nuevo proveedor/ }));
  await user.type(screen.getByLabelText('Nombre o razón social *'), 'Proveedor');
  await user.type(screen.getByLabelText('Identificador del proveedor *'), 'ABC');
  await user.type(screen.getByLabelText('Teléfono'), '77777777');
  await user.click(screen.getByRole('button', { name: 'Registrar proveedor' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Ya existe');
  expect((screen.getByLabelText('Identificador del proveedor *') as HTMLInputElement).value).toBe('ABC');
  expect(suppliersApi.create).toHaveBeenCalledWith({ identifier: 'ABC', name: 'Proveedor', phone: '77777777', email: null, address: null, contactName: null });
});
it('permite reintentar una falla de conexión', async () => {
  const user = userEvent.setup(); vi.mocked(purchasesApi.list).mockRejectedValueOnce(new Error('Sin conexión'));
  render(<Compras/>); await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('Todavía no hay compras');
  expect(purchasesApi.list).toHaveBeenCalledTimes(2);
});
it('no permite recibir una compra que el servidor ya marca recibida', async () => {
  const user = userEvent.setup();
  const purchase = { id: 1, supplierId: 1, supplierName: 'Proveedor', registeredAt: '2026-11-11T12:00:00Z', status: 'Received' as const, receivedAt: '2026-11-11T12:05:00Z', total: 10 };
  vi.mocked(purchasesApi.list).mockResolvedValue([purchase]); vi.mocked(purchasesApi.get).mockResolvedValue({ ...purchase, details: [] });
  render(<Compras/>); await user.click(await screen.findByRole('button', { name: /Ver detalle/ }));
  await screen.findByText('Esta compra ya fue recibida y no puede recibirse nuevamente.');
  expect(screen.queryByRole('button', { name: 'Recibir compra' })).toBeNull();
  expect(purchasesApi.receive).not.toHaveBeenCalled();
});
