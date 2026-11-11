import { request } from './http';
export interface SupplierInput { identifier: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null }
export interface Supplier extends SupplierInput { id: number }
export interface PurchaseLineInput { productId: number; quantity: number; unitCost: number }
export interface PurchaseInput { supplierId: number; details: PurchaseLineInput[] }
export interface PurchaseSummary { id: number; supplierId: number; supplierName: string; registeredAt: string; status: 'Pending' | 'Received'; receivedAt: string | null; total: number }
export interface Purchase extends PurchaseSummary { details: (PurchaseLineInput & { id: number; productCode: string; productName: string; subtotal: number })[] }
export const suppliersApi = {
  list: (signal?: AbortSignal) => request<Supplier[]>('/suppliers', { signal }),
  get: (id: number) => request<Supplier>(`/suppliers/${id}`),
  create: (input: SupplierInput) => request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(input) }),
};
export const purchasesApi = {
  list: (signal?: AbortSignal) => request<PurchaseSummary[]>('/purchases', { signal }),
  get: (id: number) => request<Purchase>(`/purchases/${id}`),
  create: (input: PurchaseInput) => request<Purchase>('/purchases', { method: 'POST', body: JSON.stringify(input) }),
  receive: (id: number) => request<Purchase>(`/purchases/${id}/receive`, { method: 'POST' }),
};
