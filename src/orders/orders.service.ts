import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutOrderUseCase } from './application/use-cases/checkout-order.use-case';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { PaymentProvider } from '../common/enums/commerce.enums';
import { ProcessPaymentUseCase } from '../payments/application/use-cases/process-payment.use-case';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutOrderUseCase: CheckoutOrderUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) {}

  async checkout(tenantId: number, dto: CheckoutOrderDto) {
    return this.checkoutOrderUseCase.execute(tenantId, dto);
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
    await this.findOne(tenantId, id);
    return this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async processMockPayment(tenantId: number, orderId: number) {
    return this.processPaymentUseCase.execute(
      tenantId,
      orderId,
      PaymentProvider.MOCK,
    );
  }
}
