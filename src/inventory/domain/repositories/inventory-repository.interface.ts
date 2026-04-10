
import { InventoryBalance } from '../entities/inventory-balance.entity';
import { InventoryMovementReason } from '@prisma/client';

export interface IInventoryRepository {
  findByVariantId(variantId: number, tx?: any): Promise<InventoryBalance | null>;
  save(balance: InventoryBalance, tx?: any): Promise<void>;
  recordMovement(
    movement: {
      tenantId: number;
      variantId: number;
      delta: number;
      reason: InventoryMovementReason;
      referenceType?: string;
      referenceId?: number;
    },
    tx?: any,
  ): Promise<void>;
}

export const IInventoryRepository = Symbol('IInventoryRepository');
