
import { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  findById(id: number, tx?: any): Promise<Payment | null>;
  save(payment: Payment, tx?: any): Promise<Payment>;
  findByIdempotencyKey(key: string, tenantId: number, tx?: any): Promise<Payment | null>;
}

export const IPaymentRepository = Symbol('IPaymentRepository');
