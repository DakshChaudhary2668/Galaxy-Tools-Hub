import { apiClient } from './api';
import { OrderDto, OrderItemDto, OrderAddressDto, PaymentDto } from '@galaxy/types';
import { OrderStatusType } from '@galaxy/constants';

export interface AdminOrderListItem extends OrderDto {
  customerName: string;
  customerPhone?: string;
  itemCount: number;
}

export interface AdminOrdersResponse {
  data: AdminOrderListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AdminOrderDetailFull {
  order: OrderDto;
  items: OrderItemDto[];
  address: OrderAddressDto | null;
  payment: PaymentDto | null;
}

export async function getAdminOrders(params?: Record<string, unknown>, token?: string): Promise<AdminOrdersResponse> {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryObj[key] = String(val);
      }
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  const res = await apiClient.get<AdminOrdersResponse>(`/orders${qs}`, { token });
  return { data: res.data || [], meta: res.meta };
}

export async function getAdminOrderById(id: string, token?: string): Promise<AdminOrderDetailFull | null> {
  const res = await apiClient.get<{ data: AdminOrderDetailFull }>(`/orders/${id}`, { token });
  return res?.data || null;
}

export async function updateAdminOrderStatus(orderId: string, status: OrderStatusType, token?: string): Promise<OrderDto> {
  const res = await apiClient.patch<{ data: OrderDto }>(`/orders/${orderId}/status`, { status }, { token });
  return res.data;
}

export async function getOrders(params?: Record<string, unknown>, token?: string): Promise<OrderDto[]> {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  const res = await apiClient.get<{ data: OrderDto[] }>(`/orders${qs}`, { token });
  return res?.data || [];
}

export async function getOrderById(id: string, token?: string): Promise<OrderDto | null> {
  const res = await apiClient.get<{ data: OrderDto }>(`/orders/${id}`, { token });
  return res?.data || null;
}

export async function createDraftOrder(payload: Partial<OrderDto>, token?: string): Promise<OrderDto> {
  const res = await apiClient.post<{ data: OrderDto }>('/orders/draft', payload, { token });
  return res.data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatusType, token?: string): Promise<OrderDto> {
  const res = await apiClient.patch<{ data: OrderDto }>(`/orders/${orderId}/status`, { status }, { token });
  return res.data;
}
