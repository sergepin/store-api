import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IInventoryRepository } from '../../domain/repositories/inventory-repository.interface';
import { InventoryBalance } from '../../domain/entities/inventory-balance.entity';
import { InventoryMovementReason, Prisma } from '@prisma/client';

@Injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByVariantId(
    variantId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<InventoryBalance | null> {
    const client = tx || this.prisma;
    const balance = await client.inventoryBalance.findUnique({
      where: { variantId },
    });

    if (!balance) return null;

    return new InventoryBalance(
      balance.tenantId,
      balance.variantId,
      balance.quantityOnHand,
      balance.quantityReserved,
    );
  }

  async save(
    balance: InventoryBalance,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.inventoryBalance.upsert({
      where: { variantId: balance.variantId },
      update: {
        quantityOnHand: balance.quantityOnHand,
        quantityReserved: balance.quantityReserved,
      },
      create: {
        tenantId: balance.tenantId,
        variantId: balance.variantId,
        quantityOnHand: balance.quantityOnHand,
        quantityReserved: balance.quantityReserved,
      },
    });
  }

  async recordMovement(
    movement: {
      tenantId: number;
      variantId: number;
      delta: number;
      reason: InventoryMovementReason;
      referenceType?: string;
      referenceId?: number;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.inventoryMovement.create({
      data: {
        tenantId: movement.tenantId,
        variantId: movement.variantId,
        delta: movement.delta,
        reason: movement.reason,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
      },
    });
  }
}
