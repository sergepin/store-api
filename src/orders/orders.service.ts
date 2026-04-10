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
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import {
  CustomerType,
  PaymentProvider,
  PaymentStatus,
} from '../common/enums/commerce.enums';
import { OrderStatus, Prisma } from '@prisma/client';

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

    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        await this.inventoryService.reserve(
          tenantId,
          item.variantId,
          item.quantity,
          tx,
        );
      }

      const orderNumber =
        await this.tenantsService.getNextOrderNumber(tenantId);

      let subtotalMinor = BigInt(0);
      for (const item of cart.items) {
        subtotalMinor += BigInt(item.quantity) * item.unitPriceSnapshotMinor;
      }
      const totalMinor = subtotalMinor;

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
            customerType: CustomerType.GUEST,
          },
        });

        finalCustomerId = customer.id;
      }

      const order = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          customerId: finalCustomerId,
          status: OrderStatus.PENDING_PAYMENT,
          currency: cart.currency,
          subtotalMinor,
          totalMinor,
          shippingAddress,
          billingAddress,
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
        include: { items: true },
      });

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

      if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('Order already paid');
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
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

      await tx.payment.create({
        data: {
          tenantId,
          orderId: order.id,
          provider: PaymentProvider.MOCK,
          status: PaymentStatus.APPROVED,
          amountMinor: order.totalMinor,
          currency: order.currency,
          idempotencyKey: `mock-payment-${order.id}-${Date.now()}`,
        },
      });

      return updatedOrder;
    });
  }

  async findAll(tenantId: number, query: GetOrdersQueryDto) {
    const { customerId, email, status, page = 1, limit = 20 } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      status: status || undefined,
    };

    if (customerId) where.customerId = customerId;
    if (email) where.customer = { email };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          customer: {
            select: { email: true, fullName: true },
          },
        },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        customer: true,
        payments: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(tenantId: number, id: number, newStatus: OrderStatus) {
    const order = await this.findOne(tenantId, id);

    if (
      newStatus === OrderStatus.SHIPPED &&
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.PREPARING
    ) {
      throw new BadRequestException(
        'Order must be PAID or PREPARING before shipping',
      );
    }

    if (
      newStatus === OrderStatus.DELIVERED &&
      order.status !== OrderStatus.SHIPPED
    ) {
      throw new BadRequestException('Order must be SHIPPED before delivery');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
