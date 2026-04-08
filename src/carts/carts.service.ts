import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

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
