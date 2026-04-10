
export interface IInventoryPort {
  reserve(tenantId: number, variantId: number, quantity: number, tx?: any): Promise<void>;
  commit(tenantId: number, variantId: number, quantity: number, orderId: number, tx?: any): Promise<void>;
}

export const IInventoryPort = Symbol('IInventoryPort');
