import crypto from 'crypto';
import { CheckoutItemDto } from '@galaxy/types';
import { PaymentMethod, PaymentStatus, PricingType } from '@galaxy/constants';
import { AppError } from '../utils/app-error';

export interface CheckoutProduct {
  id: string;
  name: string;
  sku: string;
  hsn_code: string;
  tax_rate: number | string;
  price: number | string | null;
  pricing_type: string;
  minimum_order_quantity?: number | null;
  weight_grams?: number | null;
  is_active: boolean;
  is_purchasable: boolean;
}

export interface CheckoutInventory {
  product_id: string;
  quantity: number;
  reserved_quantity: number;
}

export interface AuthoritativeLineItem {
  product_id: string;
  product_name: string;
  sku: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

export interface AuthoritativeCheckout {
  items: AuthoritativeLineItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  amountInPaise: number;
  currency: 'INR';
}

export interface RazorpayPaymentFacts {
  id: string;
  order_id: string;
  amount: number | string;
  currency: string;
  status: string;
  captured: boolean;
}

export interface PaymentMapping {
  id: string;
  order_id: string;
  status: string;
  amount: number | string;
  currency: string;
  transaction_id: string | null;
  gateway_reference: string;
}

const GST_RATE = 18;
const LIGHT_FREIGHT_PAISE = 6_000;
const HEAVY_FREIGHT_PAISE = 12_000;

function rupeesFromPaise(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

export function buildAuthoritativeCheckout(
  requestedItems: CheckoutItemDto[],
  products: CheckoutProduct[],
  inventories: CheckoutInventory[]
): AuthoritativeCheckout {
  const requestedByProduct = new Map<string, number>();
  for (const item of requestedItems) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError('Item quantity must be a positive integer', 400);
    }
    requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.quantity);
  }

  const productsById = new Map(products.map((product) => [product.id, product]));
  const inventoryByProduct = new Map(inventories.map((inventory) => [inventory.product_id, inventory]));
  const items: AuthoritativeLineItem[] = [];
  let subtotalPaise = 0;
  let totalWeightGrams = 0;

  for (const [productId, quantity] of requestedByProduct) {
    const product = productsById.get(productId);
    if (!product) throw new AppError(`Product not found: ${productId}`, 404);
    if (!product.is_active || !product.is_purchasable) {
      throw new AppError(`Product is not currently available for purchase: ${product.name}`, 409);
    }
    if (product.pricing_type !== PricingType.FIXED) {
      throw new AppError(`Product requires a quote and cannot be purchased online: ${product.name}`, 409);
    }
    if (product.minimum_order_quantity && quantity < product.minimum_order_quantity) {
      throw new AppError(`Minimum order quantity for ${product.name} is ${product.minimum_order_quantity}`, 400);
    }

    const unitPricePaise = Math.round(Number(product.price) * 100);
    if (!Number.isFinite(unitPricePaise) || unitPricePaise <= 0) {
      throw new AppError(`Product does not have a valid selling price: ${product.name}`, 409);
    }

    const inventory = inventoryByProduct.get(productId);
    if (!inventory) {
      throw new AppError(`Product cannot currently be purchased because inventory is unavailable: ${product.name}`, 409);
    }
    const available = Number(inventory.quantity) - Number(inventory.reserved_quantity);
    if (available < quantity) {
      throw new AppError(`Insufficient stock for ${product.name}. Available: ${Math.max(available, 0)}`, 409);
    }

    const weightGrams = Number(product.weight_grams);
    if (!Number.isInteger(weightGrams) || weightGrams <= 0) {
      throw new AppError('Shipping weight is unavailable for one or more products. Please contact support or try again later.', 409);
    }

    const lineTotalPaise = unitPricePaise * quantity;
    subtotalPaise += lineTotalPaise;
    totalWeightGrams += weightGrams * quantity;
    items.push({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      hsn_code: product.hsn_code,
      quantity,
      unit_price: rupeesFromPaise(unitPricePaise),
      discount_amount: 0,
      tax_rate: GST_RATE,
      tax_amount: 0,
      total_amount: rupeesFromPaise(lineTotalPaise)
    });
  }

  const taxPaise = Math.round((subtotalPaise * GST_RATE) / 100);
  let allocatedTaxPaise = 0;
  items.forEach((item, index) => {
    const lineBasePaise = Math.round(item.unit_price * 100) * item.quantity;
    const lineTaxPaise = index === items.length - 1
      ? taxPaise - allocatedTaxPaise
      : Math.round((lineBasePaise * GST_RATE) / 100);
    allocatedTaxPaise += lineTaxPaise;
    item.tax_amount = rupeesFromPaise(lineTaxPaise);
    item.total_amount = rupeesFromPaise(lineBasePaise + lineTaxPaise);
  });

  const shippingPaise = totalWeightGrams <= 1_000 ? LIGHT_FREIGHT_PAISE : HEAVY_FREIGHT_PAISE;
  const totalPaise = subtotalPaise + taxPaise + shippingPaise;
  return {
    items,
    subtotal: rupeesFromPaise(subtotalPaise),
    taxAmount: rupeesFromPaise(taxPaise),
    shippingAmount: rupeesFromPaise(shippingPaise),
    totalAmount: rupeesFromPaise(totalPaise),
    amountInPaise: totalPaise,
    currency: 'INR'
  };
}

export function buildPendingRazorpayPayment(
  orderId: string,
  razorpayOrderId: string,
  amount: number,
  currency: string
) {
  return {
    order_id: orderId,
    payment_method: PaymentMethod.GATEWAY,
    status: PaymentStatus.PENDING,
    amount,
    currency,
    transaction_id: null,
    gateway_reference: razorpayOrderId
  };
}

export function requirePaymentMapping(
  mapping: PaymentMapping | null,
  razorpayOrderId: string,
  correlationOrderId?: string
): PaymentMapping {
  if (!mapping) throw new AppError('Unknown Razorpay order', 404);
  if (mapping.gateway_reference !== razorpayOrderId) throw new AppError('Razorpay order mapping mismatch', 409);
  if (correlationOrderId && correlationOrderId !== mapping.order_id) {
    throw new AppError('Internal order correlation does not match the stored Razorpay order mapping', 409);
  }
  return mapping;
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
}

export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
}

export function assertRazorpayPaymentFacts(
  payment: RazorpayPaymentFacts,
  expected: { paymentId: string; razorpayOrderId: string; amount: number; currency: string }
): void {
  if (payment.id !== expected.paymentId) throw new AppError('Razorpay payment identity mismatch', 400);
  if (payment.order_id !== expected.razorpayOrderId) {
    throw new AppError('Razorpay payment does not belong to the expected order', 400);
  }
  if (Number(payment.amount) !== Math.round(expected.amount * 100)) {
    throw new AppError('Razorpay payment amount does not match the order total', 400);
  }
  if (payment.currency.toUpperCase() !== expected.currency.toUpperCase()) {
    throw new AppError('Razorpay payment currency does not match the order currency', 400);
  }
  if (payment.status !== 'captured' || payment.captured !== true) {
    throw new AppError('Razorpay payment has not been captured successfully', 409);
  }
}
