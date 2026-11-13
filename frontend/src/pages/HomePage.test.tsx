// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { products } from '../services/products';
import { inventory } from '../services/inventory';
import { suppliersApi, purchasesApi } from '../services/purchasing';
vi.mock('../services/products', () => ({ products: { list: vi.fn() } }));
vi.mock('../services/inventory', () => ({ inventory: { list: vi.fn() } }));
vi.mock('../services/purchasing', () => ({ suppliersApi: { list: vi.fn() }, purchasesApi: { list: vi.fn() } }));
const renderHome = () => render(<MemoryRouter><HomePage/></MemoryRouter>);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(products.list).mockResolvedValue([
    { id: 1, code: 'CUA', name: 'Cuaderno', description: null, price: 10, isActive: true },
    { id: 2, code: 'LAP', name: 'Lápiz', description: null, price: 2, isActive: true },
    { id: 3, code: 'GOM', name: 'Goma', description: null, price: 1, isActive: false },
  ]);
  vi.mocked(inventory.list).mockResolvedValue([
    { productId: 1, code: 'CUA', name: 'Cuaderno', isActive: true, stock: 20 },
    { productId: 2, code: 'LAP', name: 'Lápiz', isActive: true, stock: 0 },
    { productId: 3, code: 'GOM', name: 'Goma', isActive: false, stock: 1 },
  ]);
  vi.mocked(suppliersApi.list).mockResolvedValue([{ id: 1, identifier: 'PROV-1', name: 'Distribuidora Norte', contactName: null, phone: '777', email: null, address: null }]);
  vi.mocked(purchasesApi.list).mockResolvedValue([
    { id: 7, supplierId: 1, supplierName: 'Distribuidora Norte', registeredAt: '2026-11-12T12:00:00Z', status: 'Pending', receivedAt: null, total: 25 },
    { id: 6, supplierId: 1, supplierName: 'Distribuidora Norte', registeredAt: '2026-11-11T12:00:00Z', status: 'Received', receivedAt: '2026-11-11T13:00:00Z', total: 10 },
  ]);
});
afterEach(cleanup);
it('resume productos, existencias, proveedores y compras guardados', async () => {
  renderHome();
  const summary = screen.getByRole('region', { name: 'Resumen de la librería' });
  await within(summary).findByText('21', { selector: '.sr-only' });
  expect(within(summary).getByText('2', { selector: '.sr-only' })).toBeDefined();
  expect(within(summary).getAllByText('1', { selector: '.sr-only' })).toHaveLength(2);
  expect(screen.getByText('COMP-7')).toBeDefined();
  expect(screen.getByText('Pendiente')).toBeDefined();
  expect(screen.getByText('Sin stock')).toBeDefined();
  expect(screen.queryByText('Goma')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});
it('mantiene el inicio visible si una consulta falla y permite reintentar', async () => {
  const user = userEvent.setup();
  vi.mocked(purchasesApi.list).mockRejectedValueOnce(new Error('No se pudo conectar con el servidor.'));
  renderHome();
  expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
  expect(screen.getByText('No se pudieron consultar las compras.')).toBeDefined();
  expect(screen.getByRole('link', { name: /Proveedores/ })).toBeDefined();
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('COMP-7');
  expect(purchasesApi.list).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
});
