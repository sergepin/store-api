import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [TenantsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
