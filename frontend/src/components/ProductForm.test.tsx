// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProductForm } from './ProductForm';
afterEach(cleanup);
it('muestra el conflicto de nombre conservando el formulario para corregirlo', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('Ya existe un producto con ese nombre.')).mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(<MemoryRouter><ProductForm onSave={save}/></MemoryRouter>);
  await user.type(screen.getByLabelText('Código *'), 'NUEVO');
  await user.type(screen.getByLabelText('Nombre *'), 'Cartapacio');
  await user.type(screen.getByLabelText('Precio (Bs) *'), '20');
  await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Ya existe un producto con ese nombre.');
  expect((screen.getByLabelText('Nombre *') as HTMLInputElement).value).toBe('Cartapacio');
  await user.type(screen.getByLabelText('Nombre *'), ' tamaño carta');
  await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Cartapacio tamaño carta' }));
  expect(screen.queryByRole('alert')).toBeNull();
});
