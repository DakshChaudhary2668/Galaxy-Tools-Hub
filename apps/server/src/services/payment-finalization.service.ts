import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/app-error';
import { PaymentMapping } from './payment.service';

async function requireRpc<T>(name: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabaseAdmin.rpc(name, params);
  if (error) {
    const statusCode = error.code === '23505' || error.code === '23514' ? 409 : 503;
    throw new AppError(error.message || `Database operation ${name} failed`, statusCode);
  }
  return data as T;
}

export async function reserveOrderInventory(orderId: string): Promise<void> {
  await requireRpc('reserve_order_inventory', { p_order_id: orderId });
}

export async function releaseOrderInventory(orderId: string, status: 'RELEASED' | 'EXPIRED' = 'RELEASED'): Promise<void> {
  await requireRpc('release_order_inventory', { p_order_id: orderId, p_release_status: status });
}

export interface FinalizationResult {
  orderId: string;
  paymentId: string;
  status: 'paid';
  replay: boolean;
}

export async function finalizeRazorpayPayment(
  mapping: PaymentMapping,
  razorpayPaymentId: string
): Promise<FinalizationResult> {
  return requireRpc<FinalizationResult>('finalize_razorpay_payment', {
    p_gateway_reference: mapping.gateway_reference,
    p_transaction_id: razorpayPaymentId,
    p_amount: Number(mapping.amount),
    p_currency: mapping.currency
  });
}
