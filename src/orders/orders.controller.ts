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
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@TenantId() tenantId: number, @Body() dto: CheckoutOrderDto) {
    return this.ordersService.checkout(tenantId, dto);
  }

  @Post(':id/mock-payment')
  async mockPayment(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.processMockPayment(tenantId, id);
  }

  @Get()
  async findAll(@TenantId() tenantId: number, @Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(tenantId, id, dto.status);
  }
}
