import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantIdBySlug(slug: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${slug}' not found`);
    }

    return tenant.id;
  }

  async getNextOrderNumber(tenantId: number): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get and increment sequence
      // Use upsert to handle first order for a tenant
      const sequence = await tx.tenantOrderSequence.upsert({
        where: { tenantId },
        update: { nextValue: { increment: 1 } },
        create: { tenantId, nextValue: 1 },
      });

      // 2. Get tenant settings for formatting
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { orderNumberPrefix: true, orderNumberPadding: true },
      });

      const prefix = tenant?.orderNumberPrefix || '';
      const padding = tenant?.orderNumberPadding ?? 6;
      const serial = sequence.nextValue.toString().padStart(padding, '0');

      return `${prefix}${serial}`;
    });
  }
}
