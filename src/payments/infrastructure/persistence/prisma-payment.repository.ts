
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPaymentRepository } from '../../domain/repositories/payment-repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Payment | null> {
    const client = tx || this.prisma;
    const data = await client.payment.findUnique({
      where: { id },
    });

    if (!data) return null;

    return new Payment(
      data.id,
      data.tenantId,
      data.orderId,
      data.provider as any,
      data.status as any,
      data.amountMinor,
      data.currency,
      data.idempotencyKey,
      data.providerPaymentId,
      data.createdAt,
      data.updatedAt,
    );
  }

  async save(payment: Payment, tx?: Prisma.TransactionClient): Promise<Payment> {
    const client = tx || this.prisma;

    if (payment.id) {
      const updated = await client.payment.update({
        where: { id: payment.id },
        data: {
          status: payment.status,
          providerPaymentId: payment.externalReference,
        },
      });

      return new Payment(
        updated.id,
        updated.tenantId,
        updated.orderId,
        updated.provider as any,
        updated.status as any,
        updated.amountMinor,
        updated.currency,
        updated.idempotencyKey,
        updated.providerPaymentId,
        updated.createdAt,
        updated.updatedAt,
      );
    } else {
      const created = await client.payment.create({
        data: {
          tenantId: payment.tenantId,
          orderId: payment.orderId,
          provider: payment.provider,
          status: payment.status,
          amountMinor: payment.amountMinor,
          currency: payment.currency,
          idempotencyKey: payment.idempotencyKey,
          providerPaymentId: payment.externalReference,
        },
      });

      return new Payment(
        created.id,
        created.tenantId,
        created.orderId,
        created.provider as any,
        created.status as any,
        created.amountMinor,
        created.currency,
        created.idempotencyKey,
        created.providerPaymentId,
        created.createdAt,
        created.updatedAt,
      );
    }
  }

  async findByIdempotencyKey(
    key: string,
    tenantId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Payment | null> {
    const client = tx || this.prisma;
    const data = await client.payment.findFirst({
      where: { idempotencyKey: key, tenantId },
    });

    if (!data) return null;

    return new Payment(
      data.id,
      data.tenantId,
      data.orderId,
      data.provider as any,
      data.status as any,
      data.amountMinor,
      data.currency,
      data.idempotencyKey,
      data.providerPaymentId,
      data.createdAt,
      data.updatedAt,
    );
  }
}
