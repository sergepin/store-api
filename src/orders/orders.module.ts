
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { CartsModule } from '../carts/carts.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { IOrderRepository } from './domain/repositories/order-repository.interface';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { CheckoutOrderUseCase } from './application/use-cases/checkout-order.use-case';

@Module({
  imports: [PrismaModule, InventoryModule, CartsModule, TenantsModule, PaymentsModule],
  providers: [
    OrdersService,
    CheckoutOrderUseCase,
    {
      provide: IOrderRepository,
      useClass: PrismaOrderRepository,
    },
  ],
  controllers: [OrdersController],
  exports: [OrdersService, CheckoutOrderUseCase],
})
export class OrdersModule {}
