export interface Stock { productId: number; code: string; name: string; isActive: boolean; stock: number }
export type MovementType = 'Entry' | 'Exit';
export interface MovementInput { type: MovementType; quantity: number; reason: string }
export interface Movement extends MovementInput { id: number; productId: number; registeredAt: string }
export interface Adjustment { movement: Movement; currentStock: number }
export interface AvailabilityInput { items: { productId: number; quantity: number }[] }
export interface AvailabilityItem { productId: number; code: string; name: string; isActive: boolean; requestedQuantity: number; availableQuantity: number; isSufficient: boolean; missingQuantity: number }
export interface Availability { allAvailable: boolean; items: AvailabilityItem[] }
