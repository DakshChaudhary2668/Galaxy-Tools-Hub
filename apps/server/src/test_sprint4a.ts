import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CheckoutRequestSchema } from '@galaxy/types';
import { PaymentStatus, PricingType } from '@galaxy/constants';
import {
  assertRazorpayPaymentFacts,
  buildAuthoritativeCheckout,
  buildPendingRazorpayPayment,
  CheckoutInventory,
  CheckoutProduct,
  PaymentMapping,
  requirePaymentMapping,
  verifyRazorpaySignature
} from './services/payment.service';

const productId = '11111111-1111-4111-8111-111111111111';
const orderId = '22222222-2222-4222-8222-222222222222';
const otherOrderId = '33333333-3333-4333-8333-333333333333';
const product: CheckoutProduct = {
  id: productId,
  name: 'Digital Insulation Tester',
  sku: 'GTH-INS-420',
  hsn_code: '9030',
  tax_rate: 18,
  price: 1250,
  pricing_type: PricingType.FIXED,
  minimum_order_quantity: 1,
  weight_grams: 500,
  is_active: true,
  is_purchasable: true
};
const inventory: CheckoutInventory = { product_id: productId, quantity: 10, reserved_quantity: 2 };

function checkoutBody(price: number, quantity = 2) {
  return {
    items: [{ productId, quantity, price }],
    contact: { name: 'Aarav Mehta', email: 'aarav@example.com', phone: '9876543210' },
    shipping: {
      fullName: 'Aarav Mehta',
      phone: '9876543210',
      addressLine1: '42 Industrial Estate',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    }
  };
}

function errorMessage(fn: () => unknown): string {
  try {
    fn();
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const lowPriceRequest = CheckoutRequestSchema.parse(checkoutBody(1));
const highPriceRequest = CheckoutRequestSchema.parse(checkoutBody(999999));
const lowPriceCheckout = buildAuthoritativeCheckout(lowPriceRequest.items, [product], [inventory]);
const highPriceCheckout = buildAuthoritativeCheckout(highPriceRequest.items, [product], [inventory]);
assert.equal(lowPriceCheckout.subtotal, 2500, 'lower fake browser price must be ignored');
assert.equal(highPriceCheckout.subtotal, 2500, 'higher fake browser price must be ignored');
assert.deepEqual(lowPriceCheckout, highPriceCheckout, 'browser price must not affect authoritative checkout');

assert.match(
  errorMessage(() => buildAuthoritativeCheckout([{ productId, quantity: 1 }], [], [inventory])),
  /Product not found/
);
assert.equal(CheckoutRequestSchema.safeParse(checkoutBody(1, 0)).success, false, 'zero quantity must be rejected');
assert.equal(CheckoutRequestSchema.safeParse(checkoutBody(1, -1)).success, false, 'negative quantity must be rejected');
assert.equal(CheckoutRequestSchema.safeParse(checkoutBody(1, 1.5)).success, false, 'fractional quantity must be rejected');
assert.match(
  errorMessage(() => buildAuthoritativeCheckout([{ productId, quantity: 1 }], [product], [])),
  /inventory is unavailable/
);
assert.match(
  errorMessage(() => buildAuthoritativeCheckout([{ productId, quantity: 9 }], [product], [inventory])),
  /Insufficient stock/
);

const pending = buildPendingRazorpayPayment(orderId, 'order_rzp_123', lowPriceCheckout.totalAmount, 'INR');
assert.equal(pending.order_id, orderId, 'Razorpay order must bind to the correct internal order');
assert.equal(pending.gateway_reference, 'order_rzp_123');
assert.equal(pending.amount, 3010, 'pending payment must persist base price, GST, and freight');

const mapping: PaymentMapping = {
  id: '44444444-4444-4444-8444-444444444444',
  order_id: orderId,
  status: PaymentStatus.PENDING,
  amount: 3010,
  currency: 'INR',
  transaction_id: null,
  gateway_reference: 'order_rzp_123'
};
assert.match(errorMessage(() => requirePaymentMapping(null, 'order_unknown')), /Unknown Razorpay order/);
assert.match(
  errorMessage(() => requirePaymentMapping(mapping, 'order_rzp_123', otherOrderId)),
  /correlation does not match/
);
assert.equal(requirePaymentMapping(mapping, 'order_rzp_123', orderId).order_id, orderId);

const validFacts = {
  id: 'pay_rzp_123',
  order_id: 'order_rzp_123',
  amount: 301000,
  currency: 'INR',
  status: 'captured',
  captured: true
};
assert.doesNotThrow(() => assertRazorpayPaymentFacts(validFacts, {
  paymentId: 'pay_rzp_123',
  razorpayOrderId: 'order_rzp_123',
  amount: 3010,
  currency: 'INR'
}));
assert.match(errorMessage(() => assertRazorpayPaymentFacts({ ...validFacts, amount: 1 }, {
  paymentId: 'pay_rzp_123', razorpayOrderId: 'order_rzp_123', amount: 3010, currency: 'INR'
})), /amount does not match/);
assert.match(errorMessage(() => assertRazorpayPaymentFacts({ ...validFacts, currency: 'USD' }, {
  paymentId: 'pay_rzp_123', razorpayOrderId: 'order_rzp_123', amount: 3010, currency: 'INR'
})), /currency does not match/);
assert.match(errorMessage(() => assertRazorpayPaymentFacts({ ...validFacts, order_id: 'order_other' }, {
  paymentId: 'pay_rzp_123', razorpayOrderId: 'order_rzp_123', amount: 3010, currency: 'INR'
})), /does not belong/);
assert.match(errorMessage(() => assertRazorpayPaymentFacts({ ...validFacts, status: 'authorized', captured: false }, {
  paymentId: 'pay_rzp_123', razorpayOrderId: 'order_rzp_123', amount: 3010, currency: 'INR'
})), /not been captured/);

const secret = 'test_secret_not_returned';
const signature = crypto.createHmac('sha256', secret).update('order_rzp_123|pay_rzp_123').digest('hex');
assert.equal(verifyRazorpaySignature('order_rzp_123', 'pay_rzp_123', signature, secret), true);
assert.equal(verifyRazorpaySignature('order_rzp_123', 'pay_rzp_123', '0'.repeat(64), secret), false);

console.log('Sprint 4A payment trust tests passed');
