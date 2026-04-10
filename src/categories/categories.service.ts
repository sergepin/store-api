import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';

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

  /**
   * Create a new category (ADMIN)
   */
  async create(tenantId: number, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });

    if (existing) {
      throw new ConflictException(
        `Category with slug '${dto.slug}' already exists`,
      );
    }

    return this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
      },
    });
  }

  /**
   * Update an existing category (ADMIN)
   */
  async update(tenantId: number, id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { tenantId_slug: { tenantId, slug: dto.slug } },
      });
      if (existing) {
        throw new ConflictException(
          `Category with slug '${dto.slug}' already exists`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
      },
    });
  }

  /**
   * Soft-delete a category (ADMIN)
   */
  async remove(tenantId: number, id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException(`Category '${id}' not found`);
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: `Category '${id}' deleted` };
  }
}
