import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/iam.enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /orders/checkout
   * Public/Customer: Create a new order.
   */
  @Post('checkout')
  async checkout(@TenantId() tenantId: number, @Body() dto: CheckoutOrderDto) {
    return this.ordersService.checkout(tenantId, dto);
  }

  /**
   * POST /orders/:id/mock-payment
   * Public/Customer: Simulate payment (for testing).
   */
  @Post(':id/mock-payment')
  async mockPayment(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.processMockPayment(tenantId, id);
  }

  /**
   * GET /orders
   * Admin only: List all orders for the tenant with filters.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@TenantId() tenantId: number, @Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(tenantId, query);
  }

  /**
   * GET /orders/:id
   * Admin only (for now): Get detailed order info.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(tenantId, id);
  }

  /**
   * PATCH /orders/:id/status
   * Admin only: Update order status (Shipped, Delivered, etc.)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(tenantId, id, dto.status);
  }
}
