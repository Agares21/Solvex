import { request } from './http';

export const customersApi = {
  list: (signal) => request('/customers', { signal }),
  get: (id, signal) => request(`/customers/${id}`, { signal }),
  create: (input) => request('/customers', { method: 'POST', body: JSON.stringify(input) }),
  /** Datos del cliente con sus pedidos y maquetas (HU-10). */
  history: (id, signal) => request(`/customers/${id}/history`, { signal }),
};

export const ordersApi = {
  list: (signal) => request('/orders', { signal }),
  get: (id, signal) => request(`/orders/${id}`, { signal }),
  create: (input) => request('/orders', { method: 'POST', body: JSON.stringify(input) }),
};

export const mockupsApi = {
  list: (signal) => request('/mockups', { signal }),
  get: (id, signal) => request(`/mockups/${id}`, { signal }),
  create: (input) => request('/mockups', { method: 'POST', body: JSON.stringify(input) }),
  pay: (id, input) => request(`/mockups/${id}/payments`, { method: 'POST', body: JSON.stringify(input) }),
  updateStatus: (id, status) => request(`/mockups/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};
