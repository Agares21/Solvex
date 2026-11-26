import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import ClientesPage from '../src/pages/ClientesPage';
import ClienteHistorialPage from '../src/pages/ClienteHistorialPage';
import PedidoDetallePage from '../src/pages/PedidoDetallePage';
import { codigoPedido } from '../src/pages/pedidosFormato';
import { codigoMaqueta } from '../src/pages/maquetasFormato';
import { customersApi, mockupsApi, ordersApi } from '../src/services/sprint3';
import { products } from '../src/services/products';
afterEach(cleanup);

// Sin mocks: API real sobre una base de desarrollo ya migrada. Crea sus propios registros y no modifica los existentes.
const app = (ruta: string) => render(<MemoryRouter initialEntries={[ruta]}><Routes>
  <Route path="/customers" element={<ClientesPage/>}/>
  <Route path="/customers/:id" element={<ClienteHistorialPage/>}/>
  <Route path="/orders/:id" element={<PedidoDetallePage/>}/>
</Routes></MemoryRouter>);

it('busca un cliente y muestra solo sus pedidos y maquetas guardados en SQL Server', async () => {
  const key = `HIS-${Date.now()}`;
  const producto = await products.create({ code: key, name: `Producto ${key}`, price: 12.5, description: null });
  const cliente = await customersApi.create({ name: `Cliente ${key}`, phone: '70000000' });
  const otro = await customersApi.create({ name: `Otro ${key}`, phone: null });
  const pedido = await ordersApi.create({ customerId: cliente.id, observations: null, details: [{ productId: producto.id, quantity: 2 }] });
  const pedidoAjeno = await ordersApi.create({ customerId: otro.id, observations: null, details: [{ productId: producto.id, quantity: 1 }] });
  const maqueta = await mockupsApi.create({
    customerId: cliente.id, institution: `Colegio ${key}`, type: 'Educativa', size: 'Mediana',
    deliveryAt: new Date(Date.now() + 5 * 86400000).toISOString(), observations: null, agreedPrice: 150,
  });

  const user = userEvent.setup();
  app('/customers');
  await user.type(await screen.findByLabelText(/Buscar por nombre/), `cliente ${key.toLowerCase()}`);
  await user.click(await screen.findByRole('link', { name: `Ver historial de Cliente ${key}` }));

  expect(await screen.findByRole('heading', { name: `Cliente ${key}`, level: 1 })).toBeDefined();
  expect(screen.getByText('70000000')).toBeDefined();
  const pedidos = screen.getByRole('region', { name: /Pedidos/ });
  expect(within(pedidos).getAllByRole('row')).toHaveLength(2);
  expect(within(pedidos).getByRole('link', { name: codigoPedido(pedido.id) })).toBeDefined();
  expect(within(pedidos).queryByText(codigoPedido(pedidoAjeno.id))).toBeNull();
  expect(within(pedidos).getByText('Bs. 25.00')).toBeDefined();
  expect(within(pedidos).getByText('Pendiente')).toBeDefined();
  const maquetas = screen.getByRole('region', { name: /Trabajos de maquetas/ });
  expect(within(maquetas).getByRole('link', { name: codigoMaqueta(maqueta.id) })).toBeDefined();
  expect(within(maquetas).getByText(`Colegio ${key}`)).toBeDefined();

  // Desde el historial se abre el pedido y «Volver» regresa al mismo historial.
  await user.click(within(pedidos).getByRole('link', { name: codigoPedido(pedido.id) }));
  await user.click(await screen.findByRole('button', { name: `← Volver al historial de Cliente ${key}` }));
  expect(await screen.findByRole('heading', { name: `Cliente ${key}`, level: 1 })).toBeDefined();
});

it('muestra el estado vacío de un cliente sin solicitudes y avisa si el cliente no existe', async () => {
  const cliente = await customersApi.create({ name: `Sin solicitudes ${Date.now()}`, phone: null });
  const vista = app(`/customers/${cliente.id}`);
  expect(await screen.findByText('Este cliente todavía no tiene solicitudes')).toBeDefined();
  vista.unmount();
  const inexistente = (await customersApi.list()).reduce((max: number, c: { id: number }) => Math.max(max, c.id), 0) + 1000;
  app(`/customers/${inexistente}`);
  expect(await screen.findByText('Cliente no encontrado')).toBeDefined();
});
