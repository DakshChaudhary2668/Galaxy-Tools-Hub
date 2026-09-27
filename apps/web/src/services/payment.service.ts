import { apiClient } from './api';

export interface CheckoutPayload {
  items: {
    productId: string;
    quantity: number;
  }[];
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
  contact: { name: string; email: string; phone: string };
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface OrderDetails {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  placedAt: string;
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const res = await apiClient.post<{ data: CheckoutResponse }>('/payments/checkout', payload);
  return res.data;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<void> {
  await apiClient.post('/payments/verify', payload);
}

export async function getOrderStatus(orderId: string): Promise<OrderDetails | null> {
  const res = await apiClient.get<{ data: OrderDetails }>(`/payments/order-status/${orderId}`);
  return res?.data || null;
}
