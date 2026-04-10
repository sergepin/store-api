import {
  PaymentProvider,
  PaymentStatus,
} from '../../../common/enums/commerce.enums';

export class Payment {
  constructor(
    public readonly id: number | undefined,
    public readonly tenantId: number,
    public readonly orderId: number,
    public readonly provider: PaymentProvider,
    public status: PaymentStatus,
    public readonly amountMinor: bigint,
    public readonly currency: string,
    public readonly idempotencyKey: string,
    public readonly externalReference: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(params: {
    tenantId: number;
    orderId: number;
    provider: PaymentProvider;
    amountMinor: bigint;
    currency: string;
    idempotencyKey: string;
  }): Payment {
    return new Payment(
      undefined,
      params.tenantId,
      params.orderId,
      params.provider,
      PaymentStatus.PENDING,
      params.amountMinor,
      params.currency,
      params.idempotencyKey,
    );
  }

  approve(externalReference?: string): void {
    if (this.status === PaymentStatus.APPROVED) return;
    this.status = PaymentStatus.APPROVED;
    (this as any).externalReference =
      externalReference || this.externalReference;
  }

  fail(): void {
    this.status = PaymentStatus.REJECTED;
  }
}
