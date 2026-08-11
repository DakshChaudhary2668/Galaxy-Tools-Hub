import { apiClient } from './api';
import { OrderDto } from '@galaxy/types';

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

export async function submitPaymentEvidence(
  payload: { orderId: string; utrNumber: string; receiptUrl: string },
  token?: string
) {
  return apiClient.post<{ message: string }>('/payments/submit-evidence', payload, { token });
}

export async function verifyPayment(
  orderId: string,
  action: 'approve' | 'reject',
  token?: string
) {
  return apiClient.post<{ message: string }>(`/admin/payments/${orderId}/verify-payment`, { action }, { token });
}
