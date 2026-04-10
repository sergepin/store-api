import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { GetProductsQueryDto } from '../products/dto/get-products-query.dto';

@Controller('category')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * GET /category
   * Returns all active categories for the tenant.
   */
  @Get()
  async findAll(@TenantId() tenantId: number) {
    return this.categoriesService.findAll(tenantId);
  }

  /**
   * GET /category/:slug
   * Returns all products in a specific category (by slug).
   */
  @Get(':slug')
  async findByCategory(
    @TenantId() tenantId: number,
    @Param('slug') slug: string,
    @Query() query: GetProductsQueryDto,
  ) {
    // 1. Resolve Category
    const category = await this.categoriesService.findBySlug(tenantId, slug);

    // 2. Resolve Products (Filtering by the category ID we just found)
    return this.productsService.findAll(tenantId, {
      ...query,
      categoryId: category.id,
    });
  }
}
