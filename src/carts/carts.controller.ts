import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { TenantsService } from '../tenants/tenants.service';

const DEV_TENANT_SLUG = 'gamer-store';

interface RequestWithUser extends Request {
  user?: {
    userId: number;
    email: string;
    tenantId: number;
  };
}

@Controller('carts')
export class CartsController {
  constructor(
    private readonly cartsService: CartsService,
    private readonly tenantsService: TenantsService,
  ) {}

  private async getTenantId(): Promise<number> {
    return this.tenantsService.getTenantIdBySlug(DEV_TENANT_SLUG);
  }

  @Get()
  async getCart(
    @Query('sessionKey') sessionKey?: string,
    @Req() req?: RequestWithUser,
  ) {
    const tenantId = await this.getTenantId();
    const customerId = req?.user?.userId;

    return this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });
  }

  @Post('items')
  async addItem(
    @Body() dto: AddToCartDto,
    @Query('sessionKey') sessionKey?: string,
    @Req() req?: RequestWithUser,
  ) {
    const tenantId = await this.getTenantId();
    const customerId = req?.user?.userId;

    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    return this.cartsService.addItem(tenantId, cart.id, dto);
  }

  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Query('sessionKey') sessionKey?: string,
    @Req() req?: RequestWithUser,
  ) {
    const tenantId = await this.getTenantId();
    const customerId = req?.user?.userId;

    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    return this.cartsService.updateItem(tenantId, cart.id, Number(itemId), dto);
  }

  @Delete('items/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @Query('sessionKey') sessionKey?: string,
    @Req() req?: RequestWithUser,
  ) {
    const tenantId = await this.getTenantId();
    const customerId = req?.user?.userId;

    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    return this.cartsService.removeItem(tenantId, cart.id, Number(itemId));
  }

  /**
   * DELETE /carts
   * Clears all items in the current cart.
   */
  @Delete()
  async clearCart(
    @Query('sessionKey') sessionKey?: string,
    @Req() req?: RequestWithUser,
  ) {
    const tenantId = await this.getTenantId();
    const customerId = req?.user?.userId;

    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    return this.cartsService.clearCart(tenantId, cart.id);
  }
}
