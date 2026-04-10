import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException(`Tenant '${id}' not found`);
    return tenant;
  }

  async update(id: number, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        orderNumberPrefix: dto.orderNumberPrefix,
        orderNumberPadding: dto.orderNumberPadding,
        settings: dto.settings,
      },
    });
  }

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
