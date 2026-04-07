import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetProductsQueryDto } from './dto/get-products-query.dto.js';

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

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. GET ALL PRODUCTS ──────────────────────────────────────────────────
  async findAll(tenantId: string, query: GetProductsQueryDto) {
    const { categoryId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Build where clause step by step
    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      status: 'published',
    };

    if (categoryId) {
      where.productCategories = { some: { categoryId } };
    }

    if (search) {
      where.OR = this.buildSearchConditions(search);
    }

    const [total, items] = await this.prisma.client.$transaction([
      this.prisma.client.product.count({ where }),
      this.prisma.client.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: search
          ? undefined // let search relevance handle ordering
          : [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    // If searching, apply in-memory relevance scoring for better ranking
    const data = search ? this.rankByRelevance(items, search) : items;

    return {
      data: data.map(this.formatProduct),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── 2. GET BY CATEGORY ───────────────────────────────────────────────────
  async findByCategory(tenantId: string, categorySlug: string, query: GetProductsQueryDto) {
    const category = await this.prisma.client.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: categorySlug } },
    });

    if (!category) throw new NotFoundException(`Category '${categorySlug}' not found`);

    return this.findAll(tenantId, { ...query, categoryId: category.id });
  }

  // ── 3. SEARCH PRODUCTS ───────────────────────────────────────────────────
  // Algorithm combines:
  //   A) Postgres full-text OR like search (filters in DB for performance)
  //   B) In-memory relevance scoring (rank the results by match quality)
  async search(tenantId: string, q: string, query: GetProductsQueryDto) {
    if (!q?.trim()) return this.findAll(tenantId, query);
    return this.findAll(tenantId, { ...query, search: q.trim() });
  }

  // ── 4. GET BY ID ─────────────────────────────────────────────────────────
  async findById(tenantId: string, productId: string) {
    const product = await this.prisma.client.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      include: {
        ...PRODUCT_INCLUDE,
        _count: { select: { variants: true } },
      },
    });

    if (!product) throw new NotFoundException(`Product '${productId}' not found`);

    return this.formatProduct(product);
  }

  // ── GET BY SLUG (for storefront canonical URLs) ───────────────────────
  async findBySlug(tenantId: string, slug: string) {
    const product = await this.prisma.client.product.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: PRODUCT_INCLUDE,
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    return this.formatProduct(product);
  }

  // ── PRIVATE: Build OR conditions for search ───────────────────────────
  private buildSearchConditions(search: string) {
    const terms = search
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6); // safety: max 6 terms

    // Full query match + individual term matches across name, description and sku
    const conditions: unknown[] = [];

    // Exact / prefix match on the whole query gets highest recall
    conditions.push({ name: { contains: search, mode: 'insensitive' } });
    conditions.push({ description: { contains: search, mode: 'insensitive' } });
    conditions.push({
      variants: { some: { sku: { contains: search, mode: 'insensitive' }, deletedAt: null } },
    });

    // Individual term matches for multi-word queries (e.g. "teclado rojo lineal")
    for (const term of terms) {
      conditions.push({ name: { contains: term, mode: 'insensitive' } });
      conditions.push({ description: { contains: term, mode: 'insensitive' } });
      conditions.push({
        variants: { some: { sku: { contains: term, mode: 'insensitive' }, deletedAt: null } },
      });
    }

    return conditions;
  }

  // ── PRIVATE: Score and sort results by relevance ──────────────────────
  private rankByRelevance<T extends { name: string; description?: string | null }>(
    items: T[],
    search: string,
  ): T[] {
    const query = search.toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);

    const score = (item: T): number => {
      const name = item.name.toLowerCase();
      const desc = (item.description ?? '').toLowerCase();
      let s = 0;

      // Exact full match in name → highest bonus
      if (name === query) s += 100;
      // Name starts with query
      if (name.startsWith(query)) s += 50;
      // Name contains query
      if (name.includes(query)) s += 30;
      // Description contains query
      if (desc.includes(query)) s += 10;

      // Per-term bonuses (for multi-word queries)
      for (const term of terms) {
        if (name.includes(term)) s += 5;
        if (desc.includes(term)) s += 2;
      }

      return s;
    };

    return [...items].sort((a, b) => score(b) - score(a));
  }

  // ── PRIVATE: Format response ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatProduct(product: any) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      status: product.status,
      isFeatured: product.isFeatured,
      primaryCategory: product.primaryCategory,
      categories: product.productCategories?.map(
        (pc: { category: unknown }) => pc.category,
      ),
      variants: product.variants?.map((v: {
        id: string;
        sku: string;
        name: string;
        attributes: unknown;
        basePriceMinor: bigint;
        currency: string;
        compareAtPriceMinor: bigint | null;
        inventoryBalance: { quantityOnHand: number; quantityReserved: number } | null;
      }) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        attributes: v.attributes,
        price: {
          amount: Number(v.basePriceMinor),
          compareAt: v.compareAtPriceMinor ? Number(v.compareAtPriceMinor) : null,
          currency: v.currency,
        },
        stock: v.inventoryBalance
          ? {
              onHand: v.inventoryBalance.quantityOnHand,
              reserved: v.inventoryBalance.quantityReserved,
              available:
                v.inventoryBalance.quantityOnHand - v.inventoryBalance.quantityReserved,
            }
          : null,
      })),
      createdAt: product.createdAt,
    };
  }
}
