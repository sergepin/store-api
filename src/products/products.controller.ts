import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { GetProductsQueryDto } from './dto/get-products-query.dto.js';

// TODO: Replace with real tenant resolution middleware (from host / JWT / header)
const DEV_TENANT_SLUG = 'gamer-store';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * Returns all published products (paginated).
   * Optional filters: ?categoryId=<uuid>&search=<text>&page=1&limit=20
   */
  @Get()
  async findAll(@Query() query: GetProductsQueryDto) {
    const tenantId =
      await this.productsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.productsService.findAll(tenantId, query);
  }

  /**
   * GET /products/search?q=mouse+gaming
   * Full-text search with relevance scoring.
   */
  @Get('search')
  async search(@Query('q') q: string, @Query() query: GetProductsQueryDto) {
    const tenantId =
      await this.productsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.productsService.search(tenantId, q, query);
  }

  /**
   * GET /products/:id
   * Returns a single product by UUID (for product detail page).
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const tenantId =
      await this.productsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.productsService.findById(tenantId, id);
  }
}
