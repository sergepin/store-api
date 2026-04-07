import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';

// In Prisma 7, PrismaClient is a factory-based class that cannot be directly
// extended. We wrap it via composition and re-expose the client instance
// so that any service can inject PrismaService and call prisma.user.findMany() etc.
const prismaInstance = new PrismaClient();

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = prismaInstance;

  // Shortcut delegates so callers can do prismaService.tenant.findMany() etc.
  get tenant() { return this.client.tenant; }
  get tenantOrderSequence() { return this.client.tenantOrderSequence; }
  get tenantDomain() { return this.client.tenantDomain; }
  get user() { return this.client.user; }
  get tenantMembership() { return this.client.tenantMembership; }
  get company() { return this.client.company; }
  get customer() { return this.client.customer; }
  get category() { return this.client.category; }
  get product() { return this.client.product; }
  get productCategory() { return this.client.productCategory; }
  get productVariant() { return this.client.productVariant; }
  get inventoryBalance() { return this.client.inventoryBalance; }
  get inventoryMovement() { return this.client.inventoryMovement; }
  get priceList() { return this.client.priceList; }
  get priceListItem() { return this.client.priceListItem; }
  get companyPriceList() { return this.client.companyPriceList; }
  get cart() { return this.client.cart; }
  get cartItem() { return this.client.cartItem; }
  get order() { return this.client.order; }
  get orderItem() { return this.client.orderItem; }
  get payment() { return this.client.payment; }
  get paymentEvent() { return this.client.paymentEvent; }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
