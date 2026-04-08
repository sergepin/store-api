import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all active categories for a specific tenant.
   */
  async findAll(tenantId: number) {
    return this.prisma.category.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Finds a category by its slug for a specific tenant.
   */
  async findBySlug(tenantId: number, slug: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        tenantId_slug: { tenantId, slug },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category '${slug}' not found`);
    }

    return category;
  }
}
