
import { Order } from '../entities/order.entity';

export interface IOrderRepository {
  findById(id: number, tx?: any): Promise<Order | null>;
  save(order: Order, tx?: any): Promise<Order>;
}

export const IOrderRepository = Symbol('IOrderRepository');
