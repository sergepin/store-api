import { Controller, Get, Param, Query } from '@nestjs/common';
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
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productsService.findAll(DEV_TENANT_SLUG as unknown as string, query);
  }

  /**
   * GET /products/search?q=mouse+gaming
   * Full-text search with relevance scoring.
   */
  @Get('search')
  search(@Query('q') q: string, @Query() query: GetProductsQueryDto) {
    return this.productsService.search(DEV_TENANT_SLUG as unknown as string, q, query);
  }

  /**
   * GET /products/category/:slug
   * Returns all products in a specific category (by slug).
   */
  @Get('category/:slug')
  findByCategory(@Param('slug') slug: string, @Query() query: GetProductsQueryDto) {
    return this.productsService.findByCategory(DEV_TENANT_SLUG as unknown as string, slug, query);
  }

  /**
   * GET /products/:id
   * Returns a single product by UUID (for product detail page).
   */
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(DEV_TENANT_SLUG as unknown as string, id);
  }
}
