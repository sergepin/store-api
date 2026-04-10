import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '../common/enums/commerce.enums';

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
  async findAll(tenantId: number, query: GetProductsQueryDto, isAdmin = false) {
    const { categoryId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
    };

    // If not admin, only show published products
    if (!isAdmin) {
      where.status = ProductStatus.PUBLISHED;
    }

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

  // ── 2. CREATE PRODUCT (ADMIN) ───────────────────────────────────────────
  async create(tenantId: number, dto: CreateProductDto) {
    // Check if slug already exists for this tenant
    const existing = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });

    if (existing) {
      throw new ConflictException(`Product with slug '${dto.slug}' already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({
        data: {
          tenantId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          status: dto.status || ProductStatus.DRAFT,
          isFeatured: dto.isFeatured,
          primaryCategoryId: dto.primaryCategoryId,
          // 2. Connect Categories
          productCategories: {
            create: dto.categoryIds?.map((categoryId) => ({
              tenantId,
              categoryId,
            })),
          },
          // 3. Create Variants and Inventory Balances
          variants: {
            create: dto.variants.map((v) => ({
              tenantId,
              sku: v.sku,
              name: v.name,
              basePriceMinor: BigInt(v.basePriceMinor),
              currency: v.currency,
              compareAtPriceMinor: v.compareAtPriceMinor ? BigInt(v.compareAtPriceMinor) : null,
              attributes: v.attributes || {},
              inventoryBalance: {
                create: {
                  tenantId,
                  quantityOnHand: v.initialStock,
                  quantityReserved: 0,
                },
              },
            })),
          },
        },
      });

      // Refetch with relations for formatting
      const result = await tx.product.findUnique({
        where: { id: product.id },
        include: PRODUCT_INCLUDE,
      });

      return this.formatProduct(result!);
    });
  }

  // ── 3. UPDATE PRODUCT (ADMIN) ───────────────────────────────────────────
  async update(tenantId: number, productId: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productId}' not found`);
    }

    // If slug is changing, check for uniqueness
    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({
        where: { tenantId_slug: { tenantId, slug: dto.slug } },
      });
      if (existing) {
        throw new ConflictException(`Product with slug '${dto.slug}' already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update basic info
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          status: dto.status,
          isFeatured: dto.isFeatured,
          primaryCategoryId: dto.primaryCategoryId,
        },
      });

      // 2. Update Categories if provided
      if (dto.categoryIds) {
        // Delete old relations
        await tx.productCategory.deleteMany({
          where: { productId, tenantId },
        });

        // Create new ones
        await tx.productCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            tenantId,
            productId,
            categoryId,
          })),
        });
      }

      const result = await tx.product.findUnique({
        where: { id: productId },
        include: PRODUCT_INCLUDE,
      });

      return this.formatProduct(result!);
    });
  }

  // ── 4. DELETE PRODUCT (ADMIN) ───────────────────────────────────────────
  async remove(tenantId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productId}' not found`);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: `Product '${productId}' deleted (soft-delete)` };
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
