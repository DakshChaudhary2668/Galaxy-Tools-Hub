import { apiClient } from './api';
import { OrderDto, OrderItemDto, OrderAddressDto, PaymentDto } from '@galaxy/types';

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

export async function getAdminOrders(params?: Record<string, unknown>, token?: string) {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryObj[key] = String(val);
      }
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  return apiClient.get<AdminOrdersResponse>(`/orders${qs}`, { token });
}

export async function getAdminOrderById(id: string, token?: string) {
  return apiClient.get<{ data: AdminOrderDetailFull }>(`/orders/${id}`, { token });
}

export async function updateAdminOrderStatus(orderId: string, status: string, token?: string) {
  return apiClient.patch<{ data: OrderDto }>(`/orders/${orderId}/status`, { status }, { token });
}

export async function getOrders(params?: Record<string, unknown>, token?: string) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiClient.get<OrderDto[]>(`/orders${qs}`, { token });
}

export async function getOrderById(id: string, token?: string) {
  return apiClient.get<OrderDto>(`/orders/${id}`, { token });
}

export async function createDraftOrder(payload: Partial<OrderDto>, token?: string) {
  return apiClient.post<OrderDto>('/orders/draft', payload, { token });
}

export async function updateOrderStatus(orderId: string, status: string, token?: string) {
  return apiClient.patch<OrderDto>(`/orders/${orderId}/status`, { status }, { token });
}
