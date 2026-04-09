import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getOrCreateCart(
    tenantId: number,
    options: { customerId?: number; sessionKey?: string },
  ) {
    const { customerId, sessionKey } = options;

    if (!customerId && !sessionKey) {
      throw new Error('Either customerId or sessionKey must be provided');
    }

    let cart = await this.prisma.cart.findFirst({
      where: {
        tenantId,
        OR: [
          { customerId: customerId ?? undefined },
          { sessionKey: sessionKey ?? undefined },
        ],
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      cart = await this.prisma.cart.create({
        data: {
          tenantId,
          customerId,
          sessionKey,
          currency: tenant?.defaultCurrency || 'USD',
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(tenantId: number, cartId: number, dto: AddToCartDto) {
    const { variantId, quantity } = dto;

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    // 1. Check current availability
    const availability = await this.inventoryService.getAvailability(
      tenantId,
      variantId,
    );

    // 2. Check existing quantity in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId, variantId },
      },
    });

    const newTotalQuantity = (existingItem?.quantity || 0) + quantity;

    if (availability.available < newTotalQuantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${availability.available}, In cart: ${existingItem?.quantity || 0}, Requested: ${quantity}`,
      );
    }

    const unitPriceSnapshotMinor = variant.basePriceMinor;

    return this.prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
      update: {
        quantity: { increment: quantity },
        unitPriceSnapshotMinor,
      },
      create: {
        tenantId,
        cartId,
        variantId,
        quantity,
        unitPriceSnapshotMinor,
      },
    });
  }

  async updateItem(
    tenantId: number,
    cartId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check availability for the new quantity
    const availability = await this.inventoryService.getAvailability(
      tenantId,
      item.variantId,
    );

    if (availability.available < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${availability.available}, Requested: ${dto.quantity}`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(tenantId: number, cartId: number, itemId: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  clearCart(tenantId: number, cartId: number) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId, tenantId },
    });
  }
}
