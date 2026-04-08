import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

// Shared product include for consistent responses
const PRODUCT_INCLUDE = {
  primaryCategory: { select: { id: true, name: true, slug: true } },
  productCategories: {
    include: { category: { select: { id: true, name: true, slug: true } } },
  },
  variants: {
    where: { deletedAt: null },
    include: { inventoryBalance: true },
  },
} as const;

// 🔥 Tipo real basado en Prisma
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. GET ALL PRODUCTS ──────────────────────────────────────────────────
  async findAll(tenantId: number, query: GetProductsQueryDto) {
    const { categoryId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
      status: 'published',
    };

    if (categoryId) {
      where.productCategories = { some: { categoryId } };
    }

    if (search?.length) {
      where.OR = this.buildSearchConditions(search);
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: search
          ? undefined
          : [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const data = search ? this.rankByRelevance(items, search) : items;

    return {
      data: data.map((p) => this.formatProduct(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── CATEGORIES ──────────────────────────────────────────────────────────
  findAllCategories(tenantId: number) {
    return this.prisma.category.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ── 2. GET BY CATEGORY ───────────────────────────────────────────────────
  async findByCategory(
    tenantId: number,
    categorySlug: string,
    query: GetProductsQueryDto,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: categorySlug } },
    });

    if (!category) {
      throw new NotFoundException(`Category '${categorySlug}' not found`);
    }

    return this.findAll(tenantId, { ...query, categoryId: category.id });
  }

  // ── 3. SEARCH PRODUCTS ───────────────────────────────────────────────────
  async search(tenantId: number, q: string, query: GetProductsQueryDto) {
    if (!q?.trim()) return this.findAll(tenantId, query);
    return this.findAll(tenantId, { ...query, search: q.trim() });
  }

  // ── 4. GET BY ID ─────────────────────────────────────────────────────────
  async findById(tenantId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      include: {
        ...PRODUCT_INCLUDE,
        _count: { select: { variants: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productId}' not found`);
    }

    return this.formatProduct(product);
  }

  // ── GET BY SLUG ─────────────────────────────────────────────────────────
  async findBySlug(tenantId: number, slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: PRODUCT_INCLUDE,
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    return this.formatProduct(product);
  }

  // ── PRIVATE: Build OR conditions ────────────────────────────────────────
  private buildSearchConditions(search: string): Prisma.ProductWhereInput[] {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);

    const conditions: Prisma.ProductWhereInput[] = [];

    conditions.push({ name: { contains: search, mode: 'insensitive' } });
    conditions.push({ description: { contains: search, mode: 'insensitive' } });
    conditions.push({
      variants: {
        some: {
          sku: { contains: search, mode: 'insensitive' },
          deletedAt: null,
        },
      },
    });

    for (const term of terms) {
      conditions.push({ name: { contains: term, mode: 'insensitive' } });
      conditions.push({ description: { contains: term, mode: 'insensitive' } });
      conditions.push({
        variants: {
          some: {
            sku: { contains: term, mode: 'insensitive' },
            deletedAt: null,
          },
        },
      });
    }

    return conditions;
  }

  // ── PRIVATE: Relevance ranking ──────────────────────────────────────────
  private rankByRelevance(
    items: ProductWithRelations[],
    search: string,
  ): ProductWithRelations[] {
    const query = search.toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);

    const score = (item: ProductWithRelations): number => {
      const name = item.name.toLowerCase();
      const desc = (item.description ?? '').toLowerCase();
      let s = 0;

      if (name === query) s += 100;
      if (name.startsWith(query)) s += 50;
      if (name.includes(query)) s += 30;
      if (desc.includes(query)) s += 10;

      for (const term of terms) {
        if (name.includes(term)) s += 5;
        if (desc.includes(term)) s += 2;
      }

      return s;
    };

    return [...items].sort((a, b) => score(b) - score(a));
  }

  // ── PRIVATE: Resolve Tenant ───────────────────────────────────────────
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

  // ── PRIVATE: Format response ──────────────────────────────────────────
  private formatProduct(product: ProductWithRelations) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      status: product.status,
      isFeatured: product.isFeatured,
      primaryCategory: product.primaryCategory,
      categories: product.productCategories?.map((pc) => pc.category),
      variants: product.variants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        attributes: v.attributes,
        price: {
          amount: Number(v.basePriceMinor),
          compareAt: v.compareAtPriceMinor
            ? Number(v.compareAtPriceMinor)
            : null,
          currency: v.currency,
        },
        stock: v.inventoryBalance
          ? {
              onHand: v.inventoryBalance.quantityOnHand,
              reserved: v.inventoryBalance.quantityReserved,
              available:
                v.inventoryBalance.quantityOnHand -
                v.inventoryBalance.quantityReserved,
            }
          : null,
      })),
      createdAt: product.createdAt,
    };
  }
}
