import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import MaquetaDetallePage from '../src/pages/MaquetaDetallePage';
import { customersApi, mockupsApi } from '../src/services/sprint3';
afterEach(cleanup);

// Sin mocks: API real sobre una base de desarrollo ya migrada (incluida MockupDeliveredAndCancelledStatuses).
// Cada prueba crea su propio cliente y su propia maqueta; no modifica registros anteriores.
async function crearMaqueta(key: string) {
  const customer = await customersApi.create({ name: `Cliente ${key}`, phone: null });
  return mockupsApi.create({
    customerId: customer.id, institution: `Colegio ${key}`, type: 'Educativa', size: 'Mediana',
    deliveryAt: new Date(Date.now() + 7 * 86400000).toISOString(), observations: 'Prueba de integración HU-09', agreedPrice: 100,
  });
}
function abrirDetalle(id: number) {
  render(<MemoryRouter initialEntries={[`/maquetas/${id}`]}><Routes><Route path="/maquetas/:id" element={<MaquetaDetallePage/>}/></Routes></MemoryRouter>);
  return screen.findByRole('region', { name: 'Estado del trabajo' });
}

it('avanza una maqueta hasta Entregada desde React y cada estado queda guardado en SQL Server', async () => {
  const mockup = await crearMaqueta(`EST-${Date.now()}`);
  const user = userEvent.setup();
  const seccion = await abrirDetalle(mockup.id);
  for (const [valor, etiqueta] of [['InProgress', 'En proceso'], ['Completed', 'Terminada'], ['Delivered', 'Entregada']]) {
    await user.selectOptions(within(seccion).getByLabelText('Cambiar estado a'), valor);
    await user.click(within(seccion).getByRole('button', { name: 'Guardar estado' }));
    await within(seccion).findByText(`Estado actualizado a «${etiqueta}».`);
    expect((await mockupsApi.get(mockup.id)).status).toBe(valor);
  }
  expect(within(seccion).getByText(/ya fue entregado/)).toBeDefined();
  // Un estado final no cambia: 409 y el registro sigue igual. Un valor no definido: 400.
  await expect(mockupsApi.updateStatus(mockup.id, 'Cancelled')).rejects.toMatchObject({ status: 409 });
  await expect(mockupsApi.updateStatus(mockup.id, 'Archived')).rejects.toMatchObject({ status: 400 });
  expect((await mockupsApi.get(mockup.id)).status).toBe('Delivered');
});

it('cancela una solicitud pendiente tras confirmar y no permite saltarse estados', async () => {
  const mockup = await crearMaqueta(`CAN-${Date.now()}`);
  await expect(mockupsApi.updateStatus(mockup.id, 'Delivered')).rejects.toMatchObject({ status: 409 });
  const user = userEvent.setup();
  const seccion = await abrirDetalle(mockup.id);
  await user.selectOptions(within(seccion).getByLabelText('Cambiar estado a'), 'Cancelled');
  await user.click(within(seccion).getByRole('button', { name: 'Guardar estado' }));
  await user.click(within(seccion).getByRole('button', { name: 'Sí, cancelar solicitud' }));
  await within(seccion).findByText(/fue cancelada: su estado es final/);
  const guardada = await mockupsApi.get(mockup.id);
  expect(guardada.status).toBe('Cancelled');
  expect(new Date(guardada.statusUpdatedAt).getTime()).toBeGreaterThanOrEqual(new Date(guardada.requestedAt).getTime());
});
