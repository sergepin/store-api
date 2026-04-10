import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IPaymentRepository } from './domain/repositories/payment-repository.interface';
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';

@Module({
  imports: [PrismaModule, InventoryModule],
  providers: [
    ProcessPaymentUseCase,
    {
      provide: IPaymentRepository,
      useClass: PrismaPaymentRepository,
    },
  ],
  exports: [ProcessPaymentUseCase],
})
export class PaymentsModule {}
