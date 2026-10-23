// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InventoryPage } from './InventoryPage';
import { AvailabilityPage } from './AvailabilityPage';
import { inventory } from '../services/inventory';
vi.mock('../services/inventory', () => ({ inventory: { list: vi.fn(), movements: vi.fn(), adjust: vi.fn(), availability: vi.fn() } }));
const stock = [ { productId: 1, code: 'CUA', name: 'Cuaderno', isActive: true, stock: 10 }, { productId: 2, code: 'LAP', name: 'Lápiz', isActive: true, stock: 2 } ];
beforeEach(() => { vi.resetAllMocks(); vi.mocked(inventory.list).mockResolvedValue(stock); vi.mocked(inventory.movements).mockResolvedValue([]); });
afterEach(cleanup);
describe('Inventario', () => {
  it('guarda una entrada con motivo y vuelve a consultar stock e historial', async () => {
    const user = userEvent.setup();
    vi.mocked(inventory.adjust).mockResolvedValue({ currentStock: 15, movement: { id: 1, productId: 1, type: 'Entry', quantity: 5, reason: 'Compra', registeredAt: '2026-10-23T12:00:00Z' } });
    render(<MemoryRouter><InventoryPage/></MemoryRouter>);
    await user.click((await screen.findAllByRole('button', { name: 'Gestionar' }))[0]);
    await user.type(screen.getByLabelText('Cantidad *'), '5');
    await user.type(screen.getByLabelText('Motivo *'), 'Compra');
    await user.click(screen.getByRole('button', { name: 'Guardar movimiento' }));
    await screen.findByText(/Nuevo saldo guardado: 15/);
    expect(inventory.adjust).toHaveBeenCalledWith(1, { type: 'Entry', quantity: 5, reason: 'Compra' });
    await waitFor(() => expect(inventory.list).toHaveBeenCalledTimes(2));
    expect(inventory.movements).toHaveBeenCalledTimes(2);
  });
  it('muestra el conflicto enviado por el servidor', async () => {
    const user = userEvent.setup(); vi.mocked(inventory.adjust).mockRejectedValue(new Error('Stock insuficiente para registrar la salida.'));
    render(<MemoryRouter><InventoryPage/></MemoryRouter>);
    await user.click((await screen.findAllByRole('button', { name: 'Gestionar' }))[0]);
    await user.selectOptions(screen.getByLabelText('Tipo de movimiento'), 'Exit');
    await user.type(screen.getByLabelText('Cantidad *'), '2'); await user.type(screen.getByLabelText('Motivo *'), 'Conteo');
    await user.click(screen.getByRole('button', { name: 'Guardar movimiento' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Stock insuficiente');
  });
});
describe('Disponibilidad', () => {
  it('consulta varios productos y muestra faltantes sin llamar a ajustes', async () => {
    const user = userEvent.setup();
    vi.mocked(inventory.availability).mockResolvedValue({ allAvailable: false, items: [ { ...stock[0], requestedQuantity: 1, availableQuantity: 10, isSufficient: true, missingQuantity: 0 }, { ...stock[1], requestedQuantity: 5, availableQuantity: 2, isSufficient: false, missingQuantity: 3 } ] });
    render(<AvailabilityPage/>);
    await user.selectOptions(await screen.findByLabelText('Producto 1'), '1');
    await user.click(screen.getByRole('button', { name: '+ Añadir producto' }));
    await user.selectOptions(screen.getByLabelText('Producto 2'), '2');
    const quantities = screen.getAllByLabelText('Cantidad solicitada'); await user.clear(quantities[1]); await user.type(quantities[1], '5');
    await user.click(screen.getByRole('button', { name: 'Comprobar disponibilidad' }));
    await screen.findByText('Insuficiente');
    expect(inventory.availability).toHaveBeenCalledWith({ items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 5 }] });
    expect(screen.getByRole('cell', { name: '3' })).toBeDefined(); expect(inventory.adjust).not.toHaveBeenCalled();
    await user.type(quantities[0], '2');
    expect(screen.queryByText('Resultado de la consulta')).toBeNull();
  });
  it('muestra errores de carga y permite reintentar', async () => {
    const user = userEvent.setup(); vi.mocked(inventory.list).mockRejectedValueOnce(new Error('No se pudo conectar'));
    render(<AvailabilityPage/>); await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByLabelText('Producto 1'); expect(inventory.list).toHaveBeenCalledTimes(2);
  });
});
