
import { Injectable } from '@nestjs/common';
import { IInventoryPort } from '../../domain/ports/inventory-port.interface';
import { InventoryService } from '../../../inventory/inventory.service';

@Injectable()
export class InventoryAdapter implements IInventoryPort {
  constructor(private readonly inventoryService: InventoryService) {}

  async reserve(tenantId: number, variantId: number, quantity: number, tx?: any): Promise<void> {
    await this.inventoryService.reserve(tenantId, variantId, quantity, tx);
  }

  async commit(tenantId: number, variantId: number, quantity: number, orderId: number, tx?: any): Promise<void> {
    await this.inventoryService.commit(tenantId, variantId, quantity, orderId, tx);
  }
}
