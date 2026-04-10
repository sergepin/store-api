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
import { OrderPaymentListener } from './application/listeners/order-payment.listener';
import { IInventoryPort } from './domain/ports/inventory-port.interface';
import { InventoryAdapter } from './infrastructure/adapters/inventory.adapter';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    CartsModule,
    TenantsModule,
    PaymentsModule,
  ],
  providers: [
    OrdersService,
    CheckoutOrderUseCase,
    OrderPaymentListener,
    {
      provide: IOrderRepository,
      useClass: PrismaOrderRepository,
    },
    {
      provide: IInventoryPort,
      useClass: InventoryAdapter,
    },
  ],
  controllers: [OrdersController],
  exports: [OrdersService, CheckoutOrderUseCase],
})
export class OrdersModule {}
