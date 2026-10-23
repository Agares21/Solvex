import { request } from './http';
import type { Adjustment, Availability, AvailabilityInput, Movement, MovementInput, Stock } from '../types/inventory';
export const inventory = {
  list: (signal?: AbortSignal) => request<Stock[]>('/inventory', { signal }),
  movements: (id: number, signal?: AbortSignal) => request<Movement[]>(`/inventory/${id}/movements`, { signal }),
  adjust: (id: number, input: MovementInput) => request<Adjustment>(`/inventory/${id}/movements`, { method: 'POST', body: JSON.stringify(input) }),
  availability: (input: AvailabilityInput) => request<Availability>('/availability', { method: 'POST', body: JSON.stringify(input) }),
};
