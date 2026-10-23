export interface ProductInput { code: string; name: string; description: string | null; price: number }
export interface Product extends ProductInput { id: number; isActive: boolean }
