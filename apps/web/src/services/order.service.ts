import { apiClient } from './api';

// TODO: implement — GET /api/v1/orders (admin)
export async function getOrders(params?: Record<string, unknown>, token?: string) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiClient.get(`/orders${qs}`, { token });
}

// TODO: implement — GET /api/v1/orders/:id (admin)
export async function getOrderById(id: string, token?: string) {
  return apiClient.get(`/orders/${id}`, { token });
}

// TODO: implement — POST /api/v1/payments/submit-evidence
export async function submitPaymentEvidence(
  _payload: { orderId: string; utrNumber: string; receiptUrl: string },
  _token?: string
) {
  // ponytail: endpoint not yet built on backend — implement when POST /api/v1/payments/submit-evidence is ready
  throw new Error('Not implemented');
}

// TODO: implement — POST /api/v1/admin/payments/:orderId/verify-payment (admin)
export async function verifyPayment(
  _orderId: string,
  _action: 'approve' | 'reject',
  _token?: string
) {
  // ponytail: endpoint not yet built on backend — implement when POST /api/v1/admin/payments/:id/verify-payment is ready
  throw new Error('Not implemented');
}
