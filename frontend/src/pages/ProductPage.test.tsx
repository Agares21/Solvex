// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductPage } from './ProductPage';
import { products } from '../services/products';
vi.mock('../services/products', () => ({ products: { get: vi.fn(), activate: vi.fn(), deactivate: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it('permite activar y volver a desactivar un producto desde su detalle', async () => {
  vi.mocked(products.get).mockResolvedValue({ id: 1, code: 'CUA', name: 'Cuaderno', description: null, price: 10, isActive: false });
  vi.mocked(products.activate).mockResolvedValue(undefined);
  vi.mocked(products.deactivate).mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/products/1']}><Routes><Route path="/products/:id" element={<ProductPage mode="detail"/>}/></Routes></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Activar producto' }));
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(products.activate).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Activar producto' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar activación' }));
  await screen.findByText('Activo');
  expect(products.activate).toHaveBeenCalledWith(1);
  await user.click(screen.getByRole('button', { name: 'Desactivar producto' }));
  await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
  await screen.findByText('Inactivo');
  expect(products.deactivate).toHaveBeenCalledWith(1);
});
