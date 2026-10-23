import { request } from './http';
import type { Product, ProductInput } from '../types/product';
export const products = {
  list: (signal?: AbortSignal) => request<Product[]>('/products', { signal }),
  get: (id: number, signal?: AbortSignal) => request<Product>(`/products/${id}`, { signal }),
  create: (input: ProductInput) => request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: ProductInput) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deactivate: (id: number) => request<void>(`/products/${id}/deactivate`, { method: 'PATCH' }),
};
