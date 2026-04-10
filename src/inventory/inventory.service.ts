import { Injectable } from '@nestjs/common';
import { InventoryMovementReason, Prisma } from '@prisma/client';
import { AdjustOnHandUseCase } from './application/use-cases/adjust-on-hand.use-case';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.use-case';
import { CommitStockUseCase } from './application/use-cases/commit-stock.use-case';
import { GetAvailabilityUseCase } from './application/use-cases/get-availability.use-case';

@Injectable()
export class InventoryService {
  constructor(
    private readonly adjustOnHandUseCase: AdjustOnHandUseCase,
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly commitStockUseCase: CommitStockUseCase,
    private readonly getAvailabilityUseCase: GetAvailabilityUseCase,
  ) {}

  /**
   * Adjusts the physical stock (Quantity On Hand).
   * Generates an InventoryMovement record for audit.
   */
  async adjustOnHand(
    tenantId: number,
    variantId: number,
    delta: number,
    reason: InventoryMovementReason,
    reference?: { type: string; id: number },
    tx?: Prisma.TransactionClient,
  ) {
    return this.adjustOnHandUseCase.execute(
      tenantId,
      variantId,
      delta,
      reason,
      reference,
      tx,
    );
  }

  /**
   * Reserves stock for an ongoing checkout/order.
   * Increments quantityReserved if enough available stock.
   */
  async reserve(
    tenantId: number,
    variantId: number,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.reserveStockUseCase.execute(tenantId, variantId, quantity, tx);
  }

  /**
   * Commits the stock for a paid order.
   * Decrements quantityReserved and quantityOnHand.
   */
  async commit(
    tenantId: number,
    variantId: number,
    quantity: number,
    orderId: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.commitStockUseCase.execute(
      tenantId,
      variantId,
      quantity,
      orderId,
      tx,
    );
  }

  /**
   * Returns current stock availability.
   */
  async getAvailability(
    tenantId: number,
    variantId: number,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getAvailabilityUseCase.execute(tenantId, variantId, tx);
  }
}
