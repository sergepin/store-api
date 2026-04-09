import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryMovementReason } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update or create the balance
      const balance = await tx.inventoryBalance.upsert({
        where: { variantId },
        update: {
          quantityOnHand: { increment: delta },
        },
        create: {
          tenantId,
          variantId,
          quantityOnHand: delta,
          quantityReserved: 0,
        },
      });

      // 2. Prevent negative stock if logic requires it (usually yes for physical stock)
      if (balance.quantityOnHand < 0) {
        throw new BadRequestException(
          `Adjustment would result in negative stock (${balance.quantityOnHand})`,
        );
      }

      // 3. Create movement log
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          variantId,
          delta,
          reason,
          referenceType: reference?.type,
          referenceId: reference?.id,
        },
      });

      return balance;
    });
  }

  /**
   * Reserves stock for an ongoing checkout/order.
   * Increments quantityReserved if enough available stock.
   */
  async reserve(tenantId: number, variantId: number, quantity: number) {
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findUnique({
        where: { variantId },
      });

      if (!balance) {
        throw new BadRequestException(
          'No inventory balance found for this item',
        );
      }

      const available = balance.quantityOnHand - balance.quantityReserved;
      if (available < quantity) {
        throw new BadRequestException(
          `Not enough stock available. Requested: ${quantity}, Available: ${available}`,
        );
      }

      return tx.inventoryBalance.update({
        where: { variantId },
        data: {
          quantityReserved: { increment: quantity },
        },
      });
    });
  }

  /**
   * Releases reserved stock (e.g., cancelled order/expired cart).
   */
  async release(tenantId: number, variantId: number, quantity: number) {
    return this.prisma.inventoryBalance.update({
      where: { variantId },
      data: {
        quantityReserved: { decrement: quantity },
      },
    });
  }

  /**
   * Finalizes the stock movement when an order is completed.
   * Decreases bothOnHand and Reserved, and logs a SALE movement.
   */
  async commit(
    tenantId: number,
    variantId: number,
    quantity: number,
    orderId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Decrease both quantities
      const balance = await tx.inventoryBalance.update({
        where: { variantId },
        data: {
          quantityOnHand: { decrement: quantity },
          quantityReserved: { decrement: quantity },
        },
      });

      // 2. Log the SALE movement
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          variantId,
          delta: -quantity,
          reason: InventoryMovementReason.SALE,
          referenceType: 'ORDER',
          referenceId: orderId,
        },
      });

      return balance;
    });
  }

  /**
   * Simple helper to get current availability.
   */
  async getAvailability(tenantId: number, variantId: number) {
    const balance = await this.prisma.inventoryBalance.findUnique({
      where: { variantId },
    });

    if (!balance) {
      return { onHand: 0, reserved: 0, available: 0 };
    }

    return {
      onHand: balance.quantityOnHand,
      reserved: balance.quantityReserved,
      available: balance.quantityOnHand - balance.quantityReserved,
    };
  }
}
