import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PricingType } from '@galaxy/constants';
import { ServerEnvSchema } from '@galaxy/config';
import {
  assertRazorpayPaymentFacts,
  buildAuthoritativeCheckout,
  CheckoutInventory,
  CheckoutProduct,
  PaymentMapping,
  requirePaymentMapping,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature
} from './services/payment.service';

let passed = 0;
function test(name: string, run: () => void): void {
  run();
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}
function message(run: () => void): string {
  try { run(); return ''; } catch (error) { return error instanceof Error ? error.message : String(error); }
}

const raw = Buffer.from('{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_1"}}}}');
const webhookSecret = 'webhook_test_secret';
const webhookSignature = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');

test('valid webhook signature is accepted', () => assert.equal(verifyRazorpayWebhookSignature(raw, webhookSignature, webhookSecret), true));
test('altered webhook bytes are rejected', () => assert.equal(verifyRazorpayWebhookSignature(Buffer.concat([raw, Buffer.from(' ')]), webhookSignature, webhookSecret), false));
test('wrong webhook secret is rejected', () => assert.equal(verifyRazorpayWebhookSignature(raw, webhookSignature, 'wrong'), false));
test('malformed webhook signature is rejected', () => assert.equal(verifyRazorpayWebhookSignature(raw, 'not-hex', webhookSecret), false));
test('uppercase webhook signature is accepted', () => assert.equal(verifyRazorpayWebhookSignature(raw, webhookSignature.toUpperCase(), webhookSecret), true));

const checkoutSecret = 'checkout_test_secret';
const checkoutSignature = crypto.createHmac('sha256', checkoutSecret).update('order_1|pay_1').digest('hex');
test('valid callback signature is accepted', () => assert.equal(verifyRazorpaySignature('order_1', 'pay_1', checkoutSignature, checkoutSecret), true));
test('callback signature is bound to payment ID', () => assert.equal(verifyRazorpaySignature('order_1', 'pay_2', checkoutSignature, checkoutSecret), false));
test('malformed callback signature is rejected', () => assert.equal(verifyRazorpaySignature('order_1', 'pay_1', 'x', checkoutSecret), false));

const facts = { id: 'pay_1', order_id: 'order_1', amount: 12500, currency: 'INR', status: 'captured', captured: true };
const expected = { paymentId: 'pay_1', razorpayOrderId: 'order_1', amount: 125, currency: 'INR' };
test('captured gateway facts pass', () => assert.doesNotThrow(() => assertRazorpayPaymentFacts(facts, expected)));
test('payment identity mismatch fails', () => assert.match(message(() => assertRazorpayPaymentFacts({ ...facts, id: 'pay_2' }, expected)), /identity mismatch/));
test('gateway order mismatch fails', () => assert.match(message(() => assertRazorpayPaymentFacts({ ...facts, order_id: 'order_2' }, expected)), /expected order/));
test('amount mismatch fails', () => assert.match(message(() => assertRazorpayPaymentFacts({ ...facts, amount: 1 }, expected)), /amount/));
test('currency mismatch fails', () => assert.match(message(() => assertRazorpayPaymentFacts({ ...facts, currency: 'USD' }, expected)), /currency/));
test('authorized-only payment fails', () => assert.match(message(() => assertRazorpayPaymentFacts({ ...facts, status: 'authorized' }, expected)), /not been captured/));
test('captured flag must be true', () => assert.match(message(() => assertRazorpayPaymentFacts({ ...facts, captured: false }, expected)), /not been captured/));

const mapping: PaymentMapping = { id: 'p1', order_id: 'internal_1', status: 'PENDING', amount: 125, currency: 'INR', transaction_id: null, gateway_reference: 'order_1' };
test('unknown gateway mapping fails', () => assert.match(message(() => requirePaymentMapping(null, 'order_1')), /Unknown/));
test('callback correlation mismatch fails', () => assert.match(message(() => requirePaymentMapping(mapping, 'order_1', 'internal_2')), /correlation/));
test('correct gateway mapping passes', () => assert.equal(requirePaymentMapping(mapping, 'order_1', 'internal_1').id, 'p1'));

const product: CheckoutProduct = { id: 'product_1', name: 'Meter', sku: 'M1', hsn_code: '9030', tax_rate: 18, price: 125, pricing_type: PricingType.FIXED, minimum_order_quantity: 1, is_active: true, is_purchasable: true };
const inventory: CheckoutInventory = { product_id: 'product_1', quantity: 2, reserved_quantity: 1 };
test('authoritative checkout ignores browser price', () => assert.equal(buildAuthoritativeCheckout([{ productId: 'product_1', quantity: 1, price: 1 } as never], [product], [inventory]).subtotal, 125));
test('missing inventory blocks checkout', () => assert.match(message(() => buildAuthoritativeCheckout([{ productId: 'product_1', quantity: 1 }], [product], [])), /inventory is unavailable/));
test('reserved stock is unavailable to another checkout', () => assert.match(message(() => buildAuthoritativeCheckout([{ productId: 'product_1', quantity: 2 }], [product], [inventory])), /Insufficient stock/));

const repoRoot = fs.existsSync(path.join(process.cwd(), 'supabase')) ? process.cwd() : path.resolve(process.cwd(), '../..');
const migration = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/20260920011714_payment_reservations_and_finalization.sql'), 'utf8');
const controller = fs.readFileSync(path.join(repoRoot, 'apps/server/src/controllers/payment.controller.ts'), 'utf8');
const server = fs.readFileSync(path.join(repoRoot, 'apps/server/src/server.ts'), 'utf8');
const routes = fs.readFileSync(path.join(repoRoot, 'apps/server/src/routes/payment.routes.ts'), 'utf8');

test('raw webhook bytes are retained before parsing', () => assert.match(server, /verify:[\s\S]*rawBody = Buffer\.from\(buffer\)/));
test('Razorpay webhook route is public and registered', () => assert.match(routes, /post\('\/webhook\/razorpay', handleRazorpayWebhook\)/));
test('public status response contains no private order details', () => {
  const statusHandler = controller.slice(controller.indexOf('export async function getPublicOrderStatus'));
  assert.doesNotMatch(statusHandler, /order_addresses|order_items|customer_notes|total_amount/);
});
test('production fails closed without webhook secret', () => {
  const result = ServerEnvSchema.safeParse({ NODE_ENV: 'production', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'a', SUPABASE_SERVICE_ROLE_KEY: 's' });
  assert.equal(result.success, false);
});
test('reservation states and positive quantity are constrained', () => {
  assert.match(migration, /ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED/);
  assert.match(migration, /check \(quantity > 0\)/i);
});
test('concurrent reservations serialize and lock inventory rows', () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /from public\.inventory[\s\S]*for update/);
});
test('finalizer mutates inventory payment and order in one function', () => {
  const finalizer = migration.slice(migration.indexOf('create or replace function public.finalize_razorpay_payment'));
  assert.match(finalizer, /update public\.inventory/);
  assert.match(finalizer, /update public\.payments/);
  assert.match(finalizer, /update public\.orders/);
  assert.match(finalizer, /v_payment\.status = 'PAID'[\s\S]*replay', true/);
  assert.match(controller, /status: 'processing'[\s\S]*recoverable: true[\s\S]*statusCode: 202/);
});
test('reservation RPCs are service-role only', () => {
  assert.match(migration, /revoke execute[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute[\s\S]*to service_role/);
});
test('expiry is idempotent and captured payments can recover released stock', () => {
  assert.match(migration, /where order_id = p_order_id and status = 'ACTIVE'/);
  assert.match(migration, /v_reservation\.status in \('RELEASED', 'EXPIRED'\)/);
});

assert.equal(passed, 30);
console.log(`Sprint 4B payment finalization tests: ${passed} passed`);
