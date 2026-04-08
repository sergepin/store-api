import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { ProductsModule } from '../products/products.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [TenantsModule, ProductsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
