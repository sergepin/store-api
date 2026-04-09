import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { CartsModule } from '../carts/carts.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, InventoryModule, CartsModule, TenantsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
