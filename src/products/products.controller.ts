import { Controller, Get, Param, Query, ParseIntPipe, Post, Body, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/iam.enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
    @Req() req: any,
  ) {
    // If user is authenticated and is Admin, show all products (including drafts)
    const isAdmin = req.user?.role === UserRole.ADMIN;
    return this.productsService.findAll(tenantId, query, isAdmin);
  }

  /**
   * POST /products
   * Admin only: Create a new product with variants and inventory.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@TenantId() tenantId: number, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  /**
   * PATCH /products/:id
   * Admin only: Update product details and category associations.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  /**
   * DELETE /products/:id
   * Admin only: Soft-delete a product.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.remove(tenantId, id);
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

  /**
   * GET /products/slug/:slug
   */
  @Get('slug/:slug')
  async findBySlug(
    @TenantId() tenantId: number,
    @Param('slug') slug: string,
  ) {
    return this.productsService.findBySlug(tenantId, slug);
  }
}
