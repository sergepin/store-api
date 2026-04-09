import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { TenantsService } from '../tenants/tenants.service';
import { CartsService } from '../carts/carts.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly tenantsService: TenantsService,
    private readonly cartsService: CartsService,
  ) {}

  async checkout(tenantId: number, dto: CheckoutOrderDto) {
    const { customerId, sessionKey, shippingAddress, billingAddress, notes } =
      dto;

    // 1. Get the cart
    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Perform checkout in a transaction
    return this.prisma.$transaction(async (tx) => {
      // a. Validate and Reserve Inventory for each item
      for (const item of cart.items) {
        await this.inventoryService.reserve(
          tenantId,
          item.variantId,
          item.quantity,
          tx,
        );
      }

      // b. Generate Order Number
      const orderNumber =
        await this.tenantsService.getNextOrderNumber(tenantId);

      // c. Calculate totals
      let subtotalMinor = BigInt(0);
      for (const item of cart.items) {
        subtotalMinor += BigInt(item.quantity) * item.unitPriceSnapshotMinor;
      }
      const totalMinor = subtotalMinor; // TODO: handle tax/shipping/discounts

      // d. Create or Find Customer (Support Guest Checkout)
      let finalCustomerId = customerId || cart.customerId;

      if (!finalCustomerId) {
        if (!dto.email) {
          throw new BadRequestException(
            'Email or Customer ID is required for checkout',
          );
        }

        const customer = await tx.customer.upsert({
          where: {
            tenantId_email: {
              tenantId,
              email: dto.email,
            },
          },
          update: {
            fullName: dto.fullName || 'Guest Customer',
          },
          create: {
            tenantId,
            email: dto.email,
            fullName: dto.fullName || 'Guest Customer',
            customerType: 'GUEST',
          },
        });
        finalCustomerId = customer.id;
      }

      // e. Create Order
      const order = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          customerId: finalCustomerId,
          status: 'PENDING_PAYMENT',
          currency: cart.currency,
          subtotalMinor: subtotalMinor,
          totalMinor: totalMinor,
          shippingAddress: shippingAddress,
          billingAddress: billingAddress,
          notes,
          items: {
            create: cart.items.map((item) => ({
              tenantId,
              variantId: item.variantId,
              productNameSnapshot: item.variant.product.name,
              variantSkuSnapshot: item.variant.sku,
              unitPriceMinor: item.unitPriceSnapshotMinor,
              quantity: item.quantity,
              lineTotalMinor:
                BigInt(item.quantity) * item.unitPriceSnapshotMinor,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // f. Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id, tenantId },
      });

      return order;
    });
  }

  async processMockPayment(tenantId: number, orderId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, tenantId },
        include: { items: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status === 'PAID')
        throw new BadRequestException('Order already paid');

      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      // 2. Commit Inventory (reduce physical stock)
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

      // 3. Create mock payment record
      await tx.payment.create({
        data: {
          tenantId,
          orderId: order.id,
          provider: 'MOCK',
          status: 'APPROVED',
          amountMinor: order.totalMinor,
          currency: order.currency,
          idempotencyKey: `mock-payment-${order.id}-${Date.now()}`,
        },
      });

      return updatedOrder;
    });
  }
}
