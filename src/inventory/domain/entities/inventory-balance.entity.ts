
export class InventoryBalance {
  constructor(
    public readonly tenantId: number,
    public readonly variantId: number,
    public quantityOnHand: number,
    public quantityReserved: number,
  ) {}

  get availableQuantity(): number {
    return this.quantityOnHand - this.quantityReserved;
  }

  adjustOnHand(delta: number): void {
    const newOnHand = this.quantityOnHand + delta;
    if (newOnHand < 0) {
      throw new Error(`Adjustment would result in negative stock (${newOnHand})`);
    }
    this.quantityOnHand = newOnHand;
  }

  reserve(quantity: number): void {
    if (this.availableQuantity < quantity) {
      throw new Error(
        `Not enough stock available. Requested: ${quantity}, Available: ${this.availableQuantity}`,
      );
    }
    this.quantityReserved += quantity;
  }

  releaseReservation(quantity: number): void {
    if (this.quantityReserved < quantity) {
      throw new Error(
        `Cannot release more than reserved. Reserved: ${this.quantityReserved}, Requested: ${quantity}`,
      );
    }
    this.quantityReserved -= quantity;
  }

  confirmReservation(quantity: number): void {
    if (this.quantityReserved < quantity) {
      throw new Error(
        `Cannot confirm more than reserved. Reserved: ${this.quantityReserved}, Requested: ${quantity}`,
      );
    }
    this.quantityReserved -= quantity;
    this.quantityOnHand -= quantity;
  }
}
