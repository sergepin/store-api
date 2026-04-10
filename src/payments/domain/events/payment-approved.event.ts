export class PaymentApprovedEvent {
  constructor(
    public readonly tenantId: number,
    public readonly orderId: number,
    public readonly amountMinor: bigint,
    public readonly paymentId: number,
  ) {}
}

export const PAYMENT_APPROVED_EVENT = 'payment.approved';
