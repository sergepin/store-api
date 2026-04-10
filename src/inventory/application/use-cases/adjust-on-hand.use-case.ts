
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInventoryRepository } from '../../domain/repositories/inventory-repository.interface';
import { InventoryMovementReason } from '@prisma/client';
import { InventoryBalance } from '../../domain/entities/inventory-balance.entity';

@Injectable()
export class AdjustOnHandUseCase {
  constructor(
    @Inject(IInventoryRepository)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(
    tenantId: number,
    variantId: number,
    delta: number,
    reason: InventoryMovementReason,
    reference?: { type: string; id: number },
    tx?: any,
  ) {
    let balance = await this.inventoryRepository.findByVariantId(variantId, tx);

    if (!balance) {
      balance = new InventoryBalance(tenantId, variantId, 0, 0);
    }

    try {
      balance.adjustOnHand(delta);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    await this.inventoryRepository.save(balance, tx);

    await this.inventoryRepository.recordMovement(
      {
        tenantId,
        variantId,
        delta,
        reason,
        referenceType: reference?.type,
        referenceId: reference?.id,
      },
      tx,
    );

    return balance;
  }
}
