import { BaseRepository } from '../repositories/base.repository';
import { OrderDto, OrderItemDto } from '@galaxy/types';
import { OrderStatus, OrderStatusType, PaymentStatus } from '@galaxy/constants';
import { AppError } from '../utils/app-error';
import { InventoryService } from './inventory.service';
import { supabaseAdmin } from '../config/supabase';

export class OrderService {
  private orderRepository: BaseRepository<OrderDto>;
  private inventoryService: InventoryService;

  constructor() {
    this.orderRepository = new BaseRepository<OrderDto>('orders');
    this.inventoryService = new InventoryService();
  }

  // State Transition Matrix
  private allowedTransitions: Record<string, string[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, OrderStatus.PENDING],
    [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PENDING]: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PACKED, OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
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
      payment_status: PaymentStatus.PENDING
    };
    return this.orderRepository.create(draftPayload);
  }

  private async getOrderItems(orderId: string): Promise<OrderItemDto[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error || !data) return [];
      return data as OrderItemDto[];
    } catch {
      return [];
    }
  }

  async reserveInventory(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const items = await this.getOrderItems(orderId);
    for (const item of items) {
      const targetId = item.product_id;
      if (targetId) {
        const res = await this.inventoryService.reserveStock(targetId, item.quantity, orderId);
        if (!res.success) {
          throw new AppError(`Insufficient stock for item: ${item.product_name}`, 400);
        }
      }
    }
    return order;
  }

  async markPendingPayment(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    if (order.status === OrderStatus.DRAFT) {
      await this.reserveInventory(orderId);
    }

    return this.transitionStatus(orderId, OrderStatus.PENDING_PAYMENT as OrderStatusType);
  }

  async markPaid(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const items = await this.getOrderItems(orderId);
    for (const item of items) {
      if (item.product_id) {
        await this.inventoryService.decrementStock(item.product_id, item.quantity);
      }
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: OrderStatus.PAID,
        payment_status: PaymentStatus.PAID,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw new AppError('Failed to mark order as paid', 500);

    const updated = await this.orderRepository.findById(orderId);
    return updated || order;
  }

  async cancelOrder(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const items = await this.getOrderItems(orderId);
    for (const item of items) {
      if (item.product_id) {
        await this.inventoryService.releaseStock(item.product_id, item.quantity, orderId);
      }
    }

    return this.transitionStatus(orderId, OrderStatus.CANCELLED as OrderStatusType);
  }

  async refundOrder(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const items = await this.getOrderItems(orderId);
    for (const item of items) {
      if (item.product_id) {
        await this.inventoryService.releaseStock(item.product_id, item.quantity, orderId);
      }
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: OrderStatus.REFUNDED,
        payment_status: PaymentStatus.REFUNDED,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw new AppError('Failed to refund order', 500);

    const updated = await this.orderRepository.findById(orderId);
    return updated || order;
  }

  async completeOrder(orderId: string): Promise<OrderDto> {
    return this.transitionStatus(orderId, OrderStatus.DELIVERED as OrderStatusType);
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
