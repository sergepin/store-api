import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * Returns all published products (paginated).
   */
  @Get()
  async findAll(
    @TenantId() tenantId: number,
    @Query() query: GetProductsQueryDto,
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  /**
   * GET /products/search?q=mouse+gaming
   */
  @Get('search')
  async search(
    @TenantId() tenantId: number,
    @Query('q') q: string,
    @Query() query: GetProductsQueryDto,
  ) {
    return this.productsService.search(tenantId, q, query);
  }

  /**
   * GET /products/:id
   */
  @Get(':id')
  async findById(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.findById(tenantId, id);
  }
}
