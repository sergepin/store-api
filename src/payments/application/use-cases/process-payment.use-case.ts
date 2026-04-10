
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/repositories/payment-repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryService } from '../../../inventory/inventory.service';
import { PaymentProvider, PaymentStatus } from '../../../common/enums/commerce.enums';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(IPaymentRepository)
    private readonly paymentRepository: IPaymentRepository,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(tenantId: number, orderId: number, provider: PaymentProvider) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get Order
      const order = await tx.order.findFirst({
        where: { id: orderId, tenantId },
        include: { items: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status === OrderStatus.PAID) throw new BadRequestException('Order already paid');

      // 2. Create/Get Payment (using idempotency key for mock)
      const idempotencyKey = `payment-${order.id}-${provider}-${Date.now()}`; // Simplified
      
      const payment = Payment.create({
        tenantId,
        orderId: order.id,
        provider,
        amountMinor: order.totalMinor,
        currency: order.currency,
        idempotencyKey,
      });

      // 3. Process logic (Simulate approval for mock)
      if (provider === PaymentProvider.MOCK) {
        payment.approve(`mock-ref-${Date.now()}`);
      }

      // 4. Save Payment
      const savedPayment = await this.paymentRepository.save(payment, tx);

      // 5. If approved, update order and commit inventory
      if (savedPayment.status === PaymentStatus.APPROVED) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });

        for (const item of order.items) {
          if (item.variantId) {
            await this.inventoryService.commit(
              tenantId,
              item.variantId,
              item.quantity,
              order.id,
              tx,
            );
          }
        }
      }

      return savedPayment;
    });
  }
}
