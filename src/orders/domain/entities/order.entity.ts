
import { OrderStatus } from '@prisma/client';

export class OrderItem {
  constructor(
    public readonly variantId: number,
    public readonly productNameSnapshot: string,
    public readonly variantSkuSnapshot: string,
    public readonly quantity: number,
    public readonly unitPriceMinor: bigint,
    public readonly lineTotalMinor: bigint,
  ) {}
}

export class Order {
  constructor(
    public readonly id: number | undefined,
    public readonly tenantId: number,
    public readonly orderNumber: string,
    public readonly customerId: number,
    public status: OrderStatus,
    public readonly currency: string,
    public subtotalMinor: bigint,
    public totalMinor: bigint,
    public readonly shippingAddress: any,
    public readonly billingAddress: any,
    public readonly notes: string | null,
    public readonly items: OrderItem[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(params: {
    tenantId: number;
    orderNumber: string;
    customerId: number;
    currency: string;
    shippingAddress: any;
    billingAddress: any;
    notes?: string;
    items: {
      variantId: number;
      productNameSnapshot: string;
      variantSkuSnapshot: string;
      quantity: number;
      unitPriceMinor: bigint;
    }[];
  }): Order {
    const orderItems = params.items.map(
      (item) =>
        new OrderItem(
          item.variantId,
          item.productNameSnapshot,
          item.variantSkuSnapshot,
          item.quantity,
          item.unitPriceMinor,
          item.unitPriceMinor * BigInt(item.quantity),
        ),
    );

    const subtotalMinor = orderItems.reduce(
      (acc, item) => acc + item.lineTotalMinor,
      BigInt(0),
    );

    return new Order(
      undefined,
      params.tenantId,
      params.orderNumber,
      params.customerId,
      OrderStatus.PENDING_PAYMENT,
      params.currency,
      subtotalMinor,
      subtotalMinor, // Total same as subtotal for now (no tax/shipping logic yet)
      params.shippingAddress,
      params.billingAddress,
      params.notes || null,
      orderItems,
    );
  }

  canCancel(): boolean {
    const cancelableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PREPARING,
    ];
    return cancelableStatuses.includes(this.status);
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new Error(`Cannot cancel order in status ${this.status}`);
    }
    this.status = OrderStatus.CANCELLED;
  }

  markAsPaid(): void {
    if (this.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error(`Cannot pay order in status ${this.status}`);
    }
    this.status = OrderStatus.PAID;
  }
}
