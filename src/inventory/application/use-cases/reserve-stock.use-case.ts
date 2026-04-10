
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IInventoryRepository } from '../../domain/repositories/inventory-repository.interface';

@Injectable()
export class ReserveStockUseCase {
  constructor(
    @Inject(IInventoryRepository)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(
    tenantId: number,
    variantId: number,
    quantity: number,
    tx?: any,
  ) {
    const balance = await this.inventoryRepository.findByVariantId(variantId, tx);

    if (!balance) {
      throw new BadRequestException('No inventory balance found for this item');
    }

    try {
      balance.reserve(quantity);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    await this.inventoryRepository.save(balance, tx);

    return balance;
  }
}
