import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TenantsService } from '../tenants/tenants.service';

// TODO: Use real tenant resolution
const DEV_TENANT_SLUG = 'gamer-store';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('checkout')
  async checkout(@Body() dto: CheckoutOrderDto) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.ordersService.checkout(tenantId, dto);
  }

  @Post(':id/mock-payment')
  async mockPayment(@Param('id', ParseIntPipe) id: number) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.ordersService.processMockPayment(tenantId, id);
  }

  @Get()
  async findAll(@Query() query: GetOrdersQueryDto) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.ordersService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.ordersService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const tenantId =
      await this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
    return this.ordersService.updateStatus(tenantId, id, dto.status);
  }
}
