
import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { IInventoryRepository } from './domain/repositories/inventory-repository.interface';
import { PrismaInventoryRepository } from './infrastructure/persistence/prisma-inventory.repository';
import { AdjustOnHandUseCase } from './application/use-cases/adjust-on-hand.use-case';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.use-case';
import { CommitStockUseCase } from './application/use-cases/commit-stock.use-case';
import { GetAvailabilityUseCase } from './application/use-cases/get-availability.use-case';

@Module({
  imports: [TenantsModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    AdjustOnHandUseCase,
    ReserveStockUseCase,
    CommitStockUseCase,
    GetAvailabilityUseCase,
    {
      provide: IInventoryRepository,
      useClass: PrismaInventoryRepository,
    },
  ],
  exports: [
    InventoryService,
    AdjustOnHandUseCase,
    ReserveStockUseCase,
    CommitStockUseCase,
    GetAvailabilityUseCase,
  ],
})
export class InventoryModule {}
