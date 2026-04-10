import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PAYMENT_APPROVED_EVENT,
  PaymentApprovedEvent,
} from '../../../payments/domain/events/payment-approved.event';
import { IOrderRepository } from '../../domain/repositories/order-repository.interface';
import { InventoryService } from '../../../inventory/inventory.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class OrderPaymentListener {
  private readonly logger = new Logger(OrderPaymentListener.name);

  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(PAYMENT_APPROVED_EVENT)
  async handlePaymentApproved(event: PaymentApprovedEvent) {
    this.logger.log(`Processing payment approval for order ${event.orderId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Get the order
        const order = await this.orderRepository.findById(event.orderId, tx);
        if (!order) {
          this.logger.error(
            `Order ${event.orderId} not found during payment processing`,
          );
          return;
        }

        // 2. Domain Logic: Mark as paid
        order.markAsPaid();

        // 3. Persist Order
        await this.orderRepository.save(order, tx);

        // 4. Commit Inventory
        for (const item of order.items) {
          await this.inventoryService.commit(
            event.tenantId,
            item.variantId,
            item.quantity,
            order.id!,
            tx,
          );
        }
      });

      this.logger.log(`Order ${event.orderId} successfully marked as PAID`);
    } catch (error) {
      this.logger.error(
        `Failed to process payment for order ${event.orderId}: ${error.message}`,
      );
    }
  }
}
