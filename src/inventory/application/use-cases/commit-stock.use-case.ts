
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInventoryRepository } from '../../domain/repositories/inventory-repository.interface';
import { InventoryMovementReason } from '@prisma/client';

@Injectable()
export class CommitStockUseCase {
  constructor(
    @Inject(IInventoryRepository)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(
    tenantId: number,
    variantId: number,
    quantity: number,
    orderId: number,
    tx?: any,
  ) {
    const balance = await this.inventoryRepository.findByVariantId(variantId, tx);

    if (!balance) {
      throw new BadRequestException('No inventory balance found for this item');
    }

    try {
      balance.confirmReservation(quantity);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    await this.inventoryRepository.save(balance, tx);

    await this.inventoryRepository.recordMovement(
      {
        tenantId,
        variantId,
        delta: -quantity,
        reason: InventoryMovementReason.SALE,
        referenceType: 'Order',
        referenceId: orderId,
      },
      tx,
    );

    return balance;
  }
}
