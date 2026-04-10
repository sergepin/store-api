import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order-repository.interface';
import { Order, OrderItem } from '../../domain/entities/order.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Order | null> {
    const client = tx || this.prisma;
    const orderData = await client.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!orderData) return null;

    return new Order(
      orderData.id,
      orderData.tenantId,
      orderData.orderNumber,
      orderData.customerId,
      orderData.status,
      orderData.currency,
      orderData.subtotalMinor,
      orderData.totalMinor,
      orderData.shippingAddress,
      orderData.billingAddress,
      orderData.notes,
      orderData.items.map(
        (item) =>
          new OrderItem(
            item.variantId!,
            item.productNameSnapshot,
            item.variantSkuSnapshot,
            item.quantity,
            item.unitPriceMinor,
            item.lineTotalMinor,
          ),
      ),
      orderData.createdAt,
      orderData.updatedAt,
    );
  }

  async save(order: Order, tx?: Prisma.TransactionClient): Promise<Order> {
    const client = tx || this.prisma;

    if (order.id) {
      // Update existing order
      const updated = await client.order.update({
        where: { id: order.id },
        data: {
          status: order.status,
          subtotalMinor: order.subtotalMinor,
          totalMinor: order.totalMinor,
        },
        include: { items: true },
      });

      return new Order(
        updated.id,
        updated.tenantId,
        updated.orderNumber,
        updated.customerId,
        updated.status,
        updated.currency,
        updated.subtotalMinor,
        updated.totalMinor,
        updated.shippingAddress,
        updated.billingAddress,
        updated.notes,
        updated.items.map(
          (item) =>
            new OrderItem(
              item.variantId!,
              item.productNameSnapshot,
              item.variantSkuSnapshot,
              item.quantity,
              item.unitPriceMinor,
              item.lineTotalMinor,
            ),
        ),
        updated.createdAt,
        updated.updatedAt,
      );
    } else {
      // Create new order
      const created = await client.order.create({
        data: {
          tenantId: order.tenantId,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          status: order.status,
          currency: order.currency,
          subtotalMinor: order.subtotalMinor,
          totalMinor: order.totalMinor,
          shippingAddress: order.shippingAddress as Prisma.InputJsonValue,
          billingAddress: order.billingAddress as Prisma.InputJsonValue,
          notes: order.notes,
          items: {
            create: order.items.map((item) => ({
              tenantId: order.tenantId,
              variantId: item.variantId,
              productNameSnapshot: item.productNameSnapshot,
              variantSkuSnapshot: item.variantSkuSnapshot,
              unitPriceMinor: item.unitPriceMinor,
              quantity: item.quantity,
              lineTotalMinor: item.lineTotalMinor,
            })),
          },
        },
        include: { items: true },
      });

      return new Order(
        created.id,
        created.tenantId,
        created.orderNumber,
        created.customerId,
        created.status,
        created.currency,
        created.subtotalMinor,
        created.totalMinor,
        created.shippingAddress,
        created.billingAddress,
        created.notes,
        created.items.map(
          (item) =>
            new OrderItem(
              item.variantId!,
              item.productNameSnapshot,
              item.variantSkuSnapshot,
              item.quantity,
              item.unitPriceMinor,
              item.lineTotalMinor,
            ),
        ),
        created.createdAt,
        created.updatedAt,
      );
    }
  }
}
