import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPaymentRepository } from '../../domain/repositories/payment-repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PaymentProvider,
  PaymentStatus,
} from '../../../common/enums/commerce.enums';
import { OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PAYMENT_APPROVED_EVENT,
  PaymentApprovedEvent,
} from '../../domain/events/payment-approved.event';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(IPaymentRepository)
    private readonly paymentRepository: IPaymentRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(tenantId: number, orderId: number, provider: PaymentProvider) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get Order
      const order = await tx.order.findFirst({
        where: { id: orderId, tenantId },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status === OrderStatus.PAID)
        throw new BadRequestException('Order already paid');

      // 2. Create/Get Payment
      const idempotencyKey = `payment-${order.id}-${provider}-${Date.now()}`;

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

      // 5. If approved, EMIT EVENT (No direct order update here anymore)
      if (savedPayment.status === PaymentStatus.APPROVED) {
        this.eventEmitter.emit(
          PAYMENT_APPROVED_EVENT,
          new PaymentApprovedEvent(
            tenantId,
            order.id,
            savedPayment.amountMinor,
            savedPayment.id!,
          ),
        );
      }

      return savedPayment;
    });
  }
}
