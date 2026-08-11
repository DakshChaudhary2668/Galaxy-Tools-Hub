import { BaseRepository } from '../repositories/base.repository';
import { OrderDto } from '@galaxy/types';
import { OrderStatus, OrderStatusType } from '@galaxy/constants';
import { AppError } from '../utils/app-error';

export class OrderService {
  private orderRepository: BaseRepository<OrderDto>;

  constructor() {
    this.orderRepository = new BaseRepository<OrderDto>('orders');
  }

  // State Transition Matrix
  private allowedTransitions: Record<string, string[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, OrderStatus.PENDING],
    [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PENDING]: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PACKED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED, OrderStatus.RETURN_REQUESTED],
    [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
    [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: []
  };

  validateTransition(currentStatus: OrderStatusType, targetStatus: OrderStatusType): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = this.allowedTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  async createDraftOrder(payload: Partial<OrderDto>): Promise<OrderDto> {
    const orderNumber = payload.order_number || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const draftPayload: Partial<OrderDto> = {
      ...payload,
      order_number: orderNumber,
      status: OrderStatus.DRAFT,
      payment_status: OrderStatus.PENDING
    };
    return this.orderRepository.create(draftPayload);
  }

  async transitionStatus(orderId: string, targetStatus: OrderStatusType): Promise<OrderDto> {
    const existing = await this.orderRepository.findById(orderId);
    if (!existing) {
      throw new AppError('Order not found', 404);
    }

    const currentStatus = existing.status as OrderStatusType;
    if (!this.validateTransition(currentStatus, targetStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
        400
      );
    }

    return this.orderRepository.update(orderId, {
      status: targetStatus,
      updated_at: new Date().toISOString()
    });
  }

  async getOrderById(id: string): Promise<OrderDto | null> {
    return this.orderRepository.findById(id);
  }

  async listOrders(limit = 20): Promise<OrderDto[]> {
    return this.orderRepository.list(limit);
  }
}
