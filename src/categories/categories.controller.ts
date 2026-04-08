import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { ProductsService } from '../products/products.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { GetProductsQueryDto } from '../products/dto/get-products-query.dto.js';

// TODO: Replace this with a dynamic tenant resolution (e.g., from middleware or headers)
const DEV_TENANT_SLUG = 'gamer-store';

@Controller('category')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly tenantsService: TenantsService,
  ) {}

  /**
   * GET /category
   * Returns all active categories for the tenant.
   */
  @Get()
  async findAll() {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.categoriesService.findAll(tenantId);
  }

  /**
   * GET /category/:slug
   * Returns all products in a specific category (by slug).
   * Orchestrates: Tenant -> Category -> Products
   */
  @Get(':slug')
  async findByCategory(
    @Param('slug') slug: string,
    @Query() query: GetProductsQueryDto,
  ) {
    // 1. Resolve Tenant
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);

    // 2. Resolve Category
    const category = await this.categoriesService.findBySlug(tenantId, slug);

    // 3. Resolve Products (Filtering by the category ID we just found)
    return this.productsService.findAll(tenantId, {
      ...query,
      categoryId: category.id,
    });
  }
}
