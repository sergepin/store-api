import { Injectable, Inject } from '@nestjs/common';
import { IInventoryRepository } from '../../domain/repositories/inventory-repository.interface';

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @Inject(IInventoryRepository)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(tenantId: number, variantId: number, tx?: any) {
    const balance = await this.inventoryRepository.findByVariantId(
      variantId,
      tx,
    );

    if (!balance) {
      return {
        onHand: 0,
        reserved: 0,
        available: 0,
      };
    }

    return {
      onHand: balance.quantityOnHand,
      reserved: balance.quantityReserved,
      available: balance.availableQuantity,
    };
  }
}
