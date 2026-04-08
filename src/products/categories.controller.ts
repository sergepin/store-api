import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from '../products/products.service.js';
import { GetProductsQueryDto } from '../products/dto/get-products-query.dto.js';

const DEV_TENANT_SLUG = 'gamer-store';

@Controller('category')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /category
   * Returns all active categories for the tenant.
   */
  @Get()
  async findAll() {
    const tenantId =
      await this.productsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.productsService.findAllCategories(tenantId);
  }

  /**
   * GET /category/:slug
   * Returns all products in a specific category (by slug).
   * Example: GET /category/mouse
   */
  @Get(':slug')
  async findByCategory(
    @Param('slug') slug: string,
    @Query() query: GetProductsQueryDto,
  ) {
    const tenantId =
      await this.productsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.productsService.findByCategory(tenantId, slug, query);
  }
}
