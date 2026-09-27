import { BaseRepository } from '../repositories/base.repository';
import { OrderDto, OrderItemDto } from '@galaxy/types';
import { OrderStatus, OrderStatusTransitions, OrderStatusType, PaymentStatus } from '@galaxy/constants';
import { AppError } from '../utils/app-error';
import { InventoryService } from './inventory.service';
import { supabaseAdmin } from '../config/supabase';
import { releaseOrderInventory, reserveOrderInventory } from './payment-finalization.service';

export class OrderService {
  private orderRepository: BaseRepository<OrderDto>;
  private inventoryService: InventoryService;

  constructor() {
    this.orderRepository = new BaseRepository<OrderDto>('orders');
    this.inventoryService = new InventoryService();
  }

  validateTransition(currentStatus: OrderStatusType, targetStatus: OrderStatusType): boolean {
    const allowed = OrderStatusTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  async createDraftOrder(payload: Partial<OrderDto>): Promise<OrderDto> {
    const orderNumber = payload.order_number || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const draftPayload: Partial<OrderDto> = {
      ...payload,
      order_number: orderNumber,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.PENDING
    };
    return this.orderRepository.create(draftPayload);
  }

  private async getOrderItems(orderId: string): Promise<OrderItemDto[]> {
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw new AppError('Failed to retrieve order items for inventory update', 500);
    return (data || []) as OrderItemDto[];
  }

  async reserveInventory(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    await reserveOrderInventory(orderId);
    return order;
  }

  async markPendingPayment(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    if (order.status === OrderStatus.PENDING) {
      await this.reserveInventory(orderId);
    }

    return order;
  }

  async markPaid(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.payment_status === PaymentStatus.PAID) return order;
    throw new AppError('Direct paid transitions are disabled; use a verified payment finalizer', 409);
  }

  async cancelOrder(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    if (!this.validateTransition(order.status, OrderStatus.CANCELLED)) {
      throw new AppError(`Invalid status transition from ${order.status} to ${OrderStatus.CANCELLED}`, 400);
    }

    await releaseOrderInventory(orderId);

    return this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      updated_at: new Date().toISOString()
    });
  }

  async refundOrder(orderId: string): Promise<OrderDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    if (!this.validateTransition(order.status, OrderStatus.REFUNDED)) {
      throw new AppError(`Invalid status transition from ${order.status} to ${OrderStatus.REFUNDED}`, 400);
    }

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

  async getOrderDetailsFull(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) return null;

    const [itemsRes, addressRes, paymentRes] = await Promise.allSettled([
      supabaseAdmin.from('order_items').select('*').eq('order_id', id),
      supabaseAdmin.from('order_addresses').select('*').eq('order_id', id).limit(1),
      supabaseAdmin.from('payments').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(1)
    ]);

    const items = itemsRes.status === 'fulfilled' && itemsRes.value.data ? itemsRes.value.data : [];
    const address = addressRes.status === 'fulfilled' && addressRes.value.data ? addressRes.value.data[0] || null : null;
    const payment = paymentRes.status === 'fulfilled' && paymentRes.value.data ? paymentRes.value.data[0] || null : null;

    return {
      order,
      items,
      address,
      payment
    };
  }

  async listOrdersWithFilters(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    dateRange?: string;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_addresses(full_name, phone, city, state), order_items(id, product_name, quantity, unit_price)', { count: 'exact' });

    // Status filter
    if (params.status && params.status !== 'ALL') {
      query = query.eq('status', params.status);
    }

    // Payment Status filter
    if (params.paymentStatus && params.paymentStatus !== 'ALL') {
      query = query.eq('payment_status', params.paymentStatus);
    }

    // Date Range filter
    if (params.dateRange && params.dateRange !== 'all') {
      const now = new Date();
      if (params.dateRange === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('created_at', todayStart);
      } else if (params.dateRange === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', sevenDaysAgo);
      } else if (params.dateRange === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', thirtyDaysAgo);
      }
    }

    // Search filter
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      query = query.or(`order_number.ilike.%${s}%,customer_notes.ilike.%${s}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const orders = (data || []).map((ord: any) => {
      let customerName = 'Guest Customer';
      let customerPhone = '';
      if (Array.isArray(ord.order_addresses) && ord.order_addresses[0]) {
        customerName = ord.order_addresses[0].full_name || customerName;
        customerPhone = ord.order_addresses[0].phone || '';
      } else if (ord.customer_notes && ord.customer_notes.includes('Contact:')) {
        const match = ord.customer_notes.match(/Contact:\s*([^|]+)/);
        if (match && match[1]) customerName = match[1].trim();
      }

      const itemCount = Array.isArray(ord.order_items)
        ? ord.order_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
        : 0;

      return {
        ...ord,
        customerName,
        customerPhone,
        itemCount
      };
    });

    const total = count || orders.length;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders,
      total,
      page,
      limit,
      totalPages
    };
  }

  async listOrders(limit = 20): Promise<OrderDto[]> {
    return this.orderRepository.list(limit);
  }
}
