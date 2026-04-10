
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order-repository.interface';
import { CheckoutOrderDto } from '../../dto/checkout-order.dto';
import { Order } from '../../domain/entities/order.entity';
import { CartsService } from '../../../carts/carts.service';
import { IInventoryPort } from '../../domain/ports/inventory-port.interface';
import { TenantsService } from '../../../tenants/tenants.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomerType } from '../../../common/enums/commerce.enums';

@Injectable()
export class CheckoutOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly cartsService: CartsService,
    @Inject(IInventoryPort)
    private readonly inventoryPort: IInventoryPort,
    private readonly tenantsService: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(tenantId: number, dto: CheckoutOrderDto) {
    const { customerId, sessionKey, shippingAddress, billingAddress, notes } =
      dto;

    const cart = await this.cartsService.getOrCreateCart(tenantId, {
      customerId,
      sessionKey,
    });

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Reserve Inventory via PORT
      for (const item of cart.items) {
        await this.inventoryPort.reserve(
          tenantId,
          item.variantId,
          item.quantity,
          tx,
        );
      }

      // 2. Get Order Number
      const orderNumber =
        await this.tenantsService.getNextOrderNumber(tenantId);

      // 3. Handle Guest Customer logic
      let finalCustomerId = customerId || cart.customerId;
      if (!finalCustomerId) {
        if (!dto.email) {
          throw new BadRequestException(
            'Email or Customer ID is required for checkout',
          );
        }

        const customer = await tx.customer.upsert({
          where: {
            tenantId_email: {
              tenantId,
              email: dto.email,
            },
          },
          update: {
            fullName: dto.fullName || 'Guest Customer',
          },
          create: {
            tenantId,
            email: dto.email,
            fullName: dto.fullName || 'Guest Customer',
            customerType: CustomerType.GUEST,
          },
        });

        finalCustomerId = customer.id;
      }

      // 4. Create Order Entity
      const order = Order.create({
        tenantId,
        orderNumber,
        customerId: finalCustomerId,
        currency: cart.currency,
        shippingAddress,
        billingAddress,
        notes,
        items: cart.items.map((item) => ({
          variantId: item.variantId,
          productNameSnapshot: item.variant.product.name,
          variantSkuSnapshot: item.variant.sku,
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceSnapshotMinor,
        })),
      });

      // 5. Save Order
      const savedOrder = await this.orderRepository.save(order, tx);

      // 6. Clear Cart
      await this.cartsService.clearCart(tenantId, cart.id);

      return savedOrder;
    });
  }
}
