import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: number) {
    const [ordersCount, productsCount, totalRevenue] = await Promise.all([
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.order.aggregate({
        where: { tenantId, status: OrderStatus.PAID },
        _sum: { totalMinor: true },
      }),
    ]);

    return {
      ordersCount,
      productsCount,
      totalRevenue: Number(totalRevenue._sum.totalMinor || 0),
    };
  }
}