import { Controller, Get, Param, Query, Post, Body, Patch, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { GetProductsQueryDto } from '../products/dto/get-products-query.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/iam.enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
   * POST /category
   * Create a new category (ADMIN)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@TenantId() tenantId: number, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(tenantId, dto);
  }

  /**
   * PATCH /category/:id
   * Update an existing category (ADMIN)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  /**
   * DELETE /category/:id
   * Soft-delete a category (ADMIN)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(tenantId, id);
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
