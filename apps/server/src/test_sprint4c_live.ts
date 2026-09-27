import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import { verifyRazorpayWebhookSignature } from './services/payment.service';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Supabase test environment is not configured');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anonymous = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const runId = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const prefix = `S4C-${runId}`;
const email = `sprint4c-${runId}@example.invalid`;
const password = `S4c-${crypto.randomBytes(12).toString('hex')}!`;

const orderIds: string[] = [];
const productIds: string[] = [];
let authUserId: string | undefined;
let profileId: string | undefined;
let server: Server | undefined;
let passed = 0;

function check(name: string, condition: unknown): void {
  assert.ok(condition, name);
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

function equal(name: string, actual: unknown, expected: unknown): void {
  assert.deepEqual(actual, expected, name);
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

async function row(table: string, id: string, columns = '*'): Promise<any> {
  const { data, error } = await admin.from(table).select(columns).eq('id', id).single();
  if (error) throw error;
  return data;
}

async function inventory(productId: string): Promise<any> {
  const { data, error } = await admin
    .from('inventory')
    .select('id, product_id, quantity, reserved_quantity')
    .eq('product_id', productId)
    .single();
  if (error) throw error;
  return data;
}

async function reservation(orderId: string): Promise<any> {
  const { data, error } = await admin
    .from('inventory_reservations')
    .select('id, order_id, product_id, quantity, status, expires_at, consumed_at, released_at')
    .eq('order_id', orderId)
    .single();
  if (error) throw error;
  return data;
}

async function rpc(name: string, args: Record<string, unknown> = {}): Promise<any> {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw error;
  return data;
}

async function createProduct(label: string, quantity: number, refs: { category: string; brand: string; vendor: string }): Promise<any> {
  const sku = `${prefix}-${label}`.toUpperCase();
  const { data: product, error: productError } = await admin.from('products').insert({
    category_id: refs.category,
    brand_id: refs.brand,
    source_vendor_id: refs.vendor,
    sku,
    source_model_no: `MODEL-${label}`,
    name: `Sprint 4C Test Product ${label}`,
    slug: `${prefix}-${label}`.toLowerCase(),
    product_type: 'PRODUCT',
    pricing_type: 'FIXED',
    price: 100,
    hsn_code: '9999',
    tax_rate: 18,
    minimum_order_quantity: 1,
    is_purchasable: false,
    is_featured: false,
    is_active: false
  }).select('id, sku').single();
  if (productError || !product) throw productError || new Error('Test product insert returned no row');
  productIds.push(product.id);

  const { error: inventoryError } = await admin.from('inventory').insert({
    product_id: product.id,
    quantity,
    reserved_quantity: 0,
    reorder_level: 0
  });
  if (inventoryError) throw inventoryError;
  return product;
}

async function createOrder(label: string, items: Array<{ product: any; quantity: number }>, amount = 100): Promise<any> {
  if (!profileId) throw new Error('Test profile is not ready');
  const { data: order, error: orderError } = await admin.from('orders').insert({
    order_number: `${prefix}-${label}`.slice(0, 50),
    user_id: profileId,
    status: 'PENDING',
    payment_status: 'PENDING',
    subtotal: amount,
    discount_amount: 0,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: amount,
    currency: 'INR',
    customer_notes: `PRIVATE-NOTE-${prefix}`
  }).select('id, order_number').single();
  if (orderError || !order) throw orderError || new Error('Test order insert returned no row');
  orderIds.push(order.id);

  const { error: itemError } = await admin.from('order_items').insert(items.map(({ product, quantity }) => ({
    order_id: order.id,
    product_id: product.id,
    product_name: product.sku,
    sku: product.sku,
    hsn_code: '9999',
    quantity,
    unit_price: amount / quantity,
    discount_amount: 0,
    tax_rate: 18,
    tax_amount: 0,
    total_amount: amount
  })));
  if (itemError) throw itemError;
  return order;
}

async function createPayment(orderId: string, label: string, amount = 100, transactionId?: string): Promise<any> {
  const { data, error } = await admin.from('payments').insert({
    order_id: orderId,
    payment_method: 'GATEWAY',
    status: 'PENDING',
    amount,
    currency: 'INR',
    gateway_reference: `rzp_${prefix}_${label}`,
    transaction_id: transactionId || null
  }).select('id, order_id, gateway_reference, transaction_id').single();
  if (error || !data) throw error || new Error('Test payment insert returned no row');
  return data;
}

async function snapshot(orderId: string, productId: string, paymentId: string): Promise<any> {
  return {
    inventory: await inventory(productId),
    reservation: await reservation(orderId),
    order: await row('orders', orderId, 'id, status, payment_status'),
    payment: await row('payments', paymentId, 'id, status, transaction_id, amount, currency, gateway_reference')
  };
}

async function cleanup(): Promise<void> {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  if (orderIds.length) {
    for (const table of ['payments', 'inventory_reservations', 'order_items', 'order_addresses']) {
      const { error } = await admin.from(table).delete().in('order_id', orderIds);
      if (error) throw error;
    }
    const { error } = await admin.from('orders').delete().in('id', orderIds);
    if (error) throw error;
  }
  if (productIds.length) {
    const { error: inventoryError } = await admin.from('inventory').delete().in('product_id', productIds);
    if (inventoryError) throw inventoryError;
    const { error: productError } = await admin.from('products').delete().in('id', productIds);
    if (productError) throw productError;
  }
  if (profileId) {
    const { error } = await admin.from('profiles').delete().eq('id', profileId);
    if (error) throw error;
  }
  if (authUserId) {
    const { error } = await admin.auth.admin.deleteUser(authUserId);
    if (error) throw error;
  }
}

async function main(): Promise<void> {
  const references = await Promise.all(['categories', 'brands', 'vendors'].map(async (table) => {
    const { data, error } = await admin.from(table).select('id').limit(1).single();
    if (error || !data) throw error || new Error(`No ${table} fixture reference exists`);
    return data.id as string;
  }));
  const refs = { category: references[0], brand: references[1], vendor: references[2] };

  const { data: authData, error: authError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (authError || !authData.user) throw authError || new Error('Test auth user was not created');
  authUserId = authData.user.id;

  const profileLookup = await admin.from('profiles').select('id').eq('user_id', authUserId).maybeSingle();
  if (profileLookup.error) throw profileLookup.error;
  if (profileLookup.data) {
    profileId = profileLookup.data.id;
  } else {
    const { data, error } = await admin.from('profiles').insert({
      user_id: authUserId,
      full_name: 'Sprint 4C Fixture',
      email,
      account_type: 'CUSTOMER',
      is_active: true
    }).select('id').single();
    if (error || !data) throw error || new Error('Test profile was not created');
    profileId = data.id;
  }

  const signedIn = createClient(url!, anonKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signInError } = await signedIn.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  const randomOrderId = crypto.randomUUID();
  const anonDenied = await anonymous.rpc('reserve_order_inventory', { p_order_id: randomOrderId });
  const authDenied = await signedIn.rpc('reserve_order_inventory', { p_order_id: randomOrderId });
  equal('anon cannot execute reservation RPC', anonDenied.error?.code, '42501');
  equal('authenticated user cannot execute reservation RPC', authDenied.error?.code, '42501');

  const schemaProduct = await createProduct('SCHEMA', 10, refs);
  const schemaOrder = await createOrder('SCHEMA', [{ product: schemaProduct, quantity: 4 }]);

  const zeroQuantity = await admin.from('inventory_reservations').insert({
    order_id: schemaOrder.id, product_id: schemaProduct.id, quantity: 0, status: 'ACTIVE', expires_at: new Date(Date.now() + 60_000).toISOString()
  });
  equal('reservation quantity constraint rejects zero', zeroQuantity.error?.code, '23514');
  const badStatus = await admin.from('inventory_reservations').insert({
    order_id: schemaOrder.id, product_id: schemaProduct.id, quantity: 1, status: 'INVALID', expires_at: new Date(Date.now() + 60_000).toISOString()
  });
  equal('reservation status constraint rejects invalid state', badStatus.error?.code, '23514');
  const negativeReserved = await admin.from('inventory').update({ reserved_quantity: -1 }).eq('product_id', schemaProduct.id);
  equal('reserved quantity cannot be negative', negativeReserved.error?.code, '23514');
  const aboveQuantity = await admin.from('inventory').update({ reserved_quantity: 11 }).eq('product_id', schemaProduct.id);
  equal('reserved quantity cannot exceed quantity', aboveQuantity.error?.code, '23514');

  const firstReserve = await rpc('reserve_order_inventory', { p_order_id: schemaOrder.id });
  equal('valid reservation reports one reserved product', firstReserve.reserved, 1);
  equal('10 stock reserving 4 yields reserved quantity 4', (await inventory(schemaProduct.id)).reserved_quantity, 4);
  equal('reservation is active', (await reservation(schemaOrder.id)).status, 'ACTIVE');
  const duplicateReservation = await admin.from('inventory_reservations').insert({
    order_id: schemaOrder.id, product_id: schemaProduct.id, quantity: 4, status: 'ACTIVE', expires_at: new Date(Date.now() + 60_000).toISOString()
  });
  equal('order/product reservation uniqueness is enforced', duplicateReservation.error?.code, '23505');
  const replayReserve = await rpc('reserve_order_inventory', { p_order_id: schemaOrder.id });
  equal('same-order reservation returns replay', replayReserve.replay, true);
  equal('same-order replay does not reserve twice', (await inventory(schemaProduct.id)).reserved_quantity, 4);

  const overOrder = await createOrder('OVER', [{ product: schemaProduct, quantity: 7 }]);
  const overReserve = await admin.rpc('reserve_order_inventory', { p_order_id: overOrder.id });
  equal('reservation beyond available stock is rejected', overReserve.error?.code, '23514');
  equal('failed second reservation leaves prior reservation unchanged', (await inventory(schemaProduct.id)).reserved_quantity, 4);

  const uniqueOrder = await createOrder('UNIQUE', [{ product: schemaProduct, quantity: 1 }]);
  const uniquePayment = await createPayment(schemaOrder.id, 'unique-a', 100, `pay_${prefix}_unique`);
  const duplicateGateway = await admin.from('payments').insert({
    order_id: uniqueOrder.id, payment_method: 'GATEWAY', status: 'PENDING', amount: 100, currency: 'INR', gateway_reference: uniquePayment.gateway_reference
  });
  equal('gateway reference uniqueness is enforced', duplicateGateway.error?.code, '23505');
  const duplicateTransaction = await admin.from('payments').insert({
    order_id: uniqueOrder.id, payment_method: 'GATEWAY', status: 'PENDING', amount: 100, currency: 'INR', gateway_reference: `rzp_${prefix}_unique-b`, transaction_id: uniquePayment.transaction_id
  });
  equal('transaction ID uniqueness is enforced', duplicateTransaction.error?.code, '23505');

  const concurrentProduct = await createProduct('CONCURRENT-RESERVE', 5, refs);
  const concurrentOrderA = await createOrder('CONCURRENT-RESERVE-A', [{ product: concurrentProduct, quantity: 4 }]);
  const concurrentOrderB = await createOrder('CONCURRENT-RESERVE-B', [{ product: concurrentProduct, quantity: 4 }]);
  const concurrentReservations = await Promise.all([
    admin.rpc('reserve_order_inventory', { p_order_id: concurrentOrderA.id }),
    admin.rpc('reserve_order_inventory', { p_order_id: concurrentOrderB.id })
  ]);
  equal('exactly one concurrent reservation succeeds', concurrentReservations.filter((result) => !result.error).length, 1);
  equal('concurrent reservation never exceeds stock', (await inventory(concurrentProduct.id)).reserved_quantity, 4);

  const rollbackProductA = await createProduct('ROLLBACK-A', 10, refs);
  const rollbackProductB = await createProduct('ROLLBACK-B', 2, refs);
  const rollbackOrder = await createOrder('RESERVE-ROLLBACK', [
    { product: rollbackProductA, quantity: 4 },
    { product: rollbackProductB, quantity: 3 }
  ]);
  const rollbackReserve = await admin.rpc('reserve_order_inventory', { p_order_id: rollbackOrder.id });
  equal('multi-product insufficient reservation is rejected', rollbackReserve.error?.code, '23514');
  equal('multi-product rollback restores product A', (await inventory(rollbackProductA.id)).reserved_quantity, 0);
  equal('multi-product rollback leaves product B unchanged', (await inventory(rollbackProductB.id)).reserved_quantity, 0);
  const { count: rollbackCount, error: rollbackCountError } = await admin.from('inventory_reservations').select('id', { count: 'exact', head: true }).eq('order_id', rollbackOrder.id);
  if (rollbackCountError) throw rollbackCountError;
  equal('multi-product rollback leaves no reservation rows', rollbackCount, 0);

  const releaseProduct = await createProduct('RELEASE', 10, refs);
  const releaseOrder = await createOrder('RELEASE', [{ product: releaseProduct, quantity: 4 }]);
  await rpc('reserve_order_inventory', { p_order_id: releaseOrder.id });
  const releaseFirst = await rpc('release_order_inventory', { p_order_id: releaseOrder.id, p_release_status: 'RELEASED' });
  equal('first release reports one row', releaseFirst.released, 1);
  equal('first release restores available stock', (await inventory(releaseProduct.id)).reserved_quantity, 0);
  const releaseSecond = await rpc('release_order_inventory', { p_order_id: releaseOrder.id, p_release_status: 'RELEASED' });
  equal('second release is idempotent', releaseSecond.released, 0);
  equal('released quantity never goes negative', (await inventory(releaseProduct.id)).reserved_quantity, 0);

  const expiryOrder = await createOrder('EXPIRY', [{ product: releaseProduct, quantity: 3 }]);
  await rpc('reserve_order_inventory', { p_order_id: expiryOrder.id });
  const { error: ageError } = await admin.from('inventory_reservations').update({ expires_at: new Date(Date.now() - 60_000).toISOString() }).eq('order_id', expiryOrder.id);
  if (ageError) throw ageError;
  const { data: stale, error: staleError } = await admin.from('inventory_reservations').select('order_id').eq('status', 'ACTIVE').lte('expires_at', new Date().toISOString());
  if (staleError) throw staleError;
  const foreignStale = (stale || []).filter((entry) => !orderIds.includes(entry.order_id));
  equal('expiry run would not touch a non-test reservation', foreignStale.length, 0);
  equal('expiry releases one stale reservation', await rpc('expire_inventory_reservations'), 1);
  equal('expired reservation has canonical state', (await reservation(expiryOrder.id)).status, 'EXPIRED');
  equal('expiry restores reserved quantity', (await inventory(releaseProduct.id)).reserved_quantity, 0);
  equal('second expiry run is idempotent', await rpc('expire_inventory_reservations'), 0);

  const finalProduct = await createProduct('FINALIZE', 10, refs);
  const finalOrder = await createOrder('FINALIZE', [{ product: finalProduct, quantity: 4 }], 400);
  await rpc('reserve_order_inventory', { p_order_id: finalOrder.id });
  const finalPayment = await createPayment(finalOrder.id, 'finalize', 400);
  const finalArgs = { p_gateway_reference: finalPayment.gateway_reference, p_transaction_id: `pay_${prefix}_finalize`, p_amount: 400, p_currency: 'INR' };
  const finalized = await rpc('finalize_razorpay_payment', finalArgs);
  equal('valid finalization is not a replay', finalized.replay, false);
  const finalizedState = await snapshot(finalOrder.id, finalProduct.id, finalPayment.id);
  equal('finalization marks payment paid', finalizedState.payment.status, 'PAID');
  equal('finalization records transaction ID', finalizedState.payment.transaction_id, finalArgs.p_transaction_id);
  equal('finalization marks order payment paid', finalizedState.order.payment_status, 'PAID');
  equal('finalization confirms order', finalizedState.order.status, 'CONFIRMED');
  equal('finalization consumes reservation', finalizedState.reservation.status, 'CONSUMED');
  equal('finalization decrements stock once', finalizedState.inventory.quantity, 6);
  equal('finalization clears reserved quantity once', finalizedState.inventory.reserved_quantity, 0);
  const beforeReplay = JSON.stringify(finalizedState);
  equal('same finalization returns replay', (await rpc('finalize_razorpay_payment', finalArgs)).replay, true);
  equal('finalization replay changes no state', JSON.stringify(await snapshot(finalOrder.id, finalProduct.id, finalPayment.id)), beforeReplay);

  const concurrentFinalProduct = await createProduct('CONCURRENT-FINAL', 10, refs);
  const concurrentFinalOrder = await createOrder('CONCURRENT-FINAL', [{ product: concurrentFinalProduct, quantity: 4 }], 400);
  await rpc('reserve_order_inventory', { p_order_id: concurrentFinalOrder.id });
  const concurrentFinalPayment = await createPayment(concurrentFinalOrder.id, 'concurrent-final', 400);
  const concurrentFinalArgs = { p_gateway_reference: concurrentFinalPayment.gateway_reference, p_transaction_id: `pay_${prefix}_concurrent`, p_amount: 400, p_currency: 'INR' };
  const concurrentFinalizations = await Promise.all([
    admin.rpc('finalize_razorpay_payment', concurrentFinalArgs),
    admin.rpc('finalize_razorpay_payment', concurrentFinalArgs)
  ]);
  equal('both concurrent finalization requests return safely', concurrentFinalizations.filter((result) => !result.error).length, 2);
  equal('concurrent finalization has one effective mutation', concurrentFinalizations.filter((result) => result.data?.replay === false).length, 1);
  equal('concurrent finalization has one replay', concurrentFinalizations.filter((result) => result.data?.replay === true).length, 1);
  const concurrentFinalState = await snapshot(concurrentFinalOrder.id, concurrentFinalProduct.id, concurrentFinalPayment.id);
  equal('concurrent finalization decrements quantity once', concurrentFinalState.inventory.quantity, 6);
  equal('concurrent finalization decrements reserved quantity once', concurrentFinalState.inventory.reserved_quantity, 0);
  equal('concurrent finalization consumes reservation once', concurrentFinalState.reservation.status, 'CONSUMED');

  const transactionProduct = await createProduct('TX-ROLLBACK', 10, refs);
  const transactionOrder = await createOrder('TX-ROLLBACK', [{ product: transactionProduct, quantity: 4 }], 400);
  await rpc('reserve_order_inventory', { p_order_id: transactionOrder.id });
  const transactionPayment = await createPayment(transactionOrder.id, 'tx-rollback', 400);
  const transactionBefore = JSON.stringify(await snapshot(transactionOrder.id, transactionProduct.id, transactionPayment.id));
  const failedFinalization = await admin.rpc('finalize_razorpay_payment', {
    p_gateway_reference: transactionPayment.gateway_reference,
    p_transaction_id: `pay_${prefix}_rollback`,
    p_amount: 401,
    p_currency: 'INR'
  });
  equal('controlled amount mismatch rejects finalization', failedFinalization.error?.code, '23514');
  equal('failed finalization rolls back every state change', JSON.stringify(await snapshot(transactionOrder.id, transactionProduct.id, transactionPayment.id)), transactionBefore);

  const recoveryProduct = await createProduct('RECOVERY', 10, refs);
  const recoveryOrder = await createOrder('RECOVERY', [{ product: recoveryProduct, quantity: 4 }], 400);
  await rpc('reserve_order_inventory', { p_order_id: recoveryOrder.id });
  await rpc('release_order_inventory', { p_order_id: recoveryOrder.id, p_release_status: 'RELEASED' });
  const recoveryPayment = await createPayment(recoveryOrder.id, 'recovery', 400);
  const recoveryResult = await rpc('finalize_razorpay_payment', {
    p_gateway_reference: recoveryPayment.gateway_reference,
    p_transaction_id: `pay_${prefix}_recovery`,
    p_amount: 400,
    p_currency: 'INR'
  });
  equal('released reservation with stock recovers successfully', recoveryResult.replay, false);
  const recoveryState = await snapshot(recoveryOrder.id, recoveryProduct.id, recoveryPayment.id);
  equal('recovered payment consumes released reservation', recoveryState.reservation.status, 'CONSUMED');
  equal('recovered payment decrements unreserved stock safely', recoveryState.inventory.quantity, 6);
  equal('recovered payment keeps reserved quantity zero', recoveryState.inventory.reserved_quantity, 0);

  const unavailableProduct = await createProduct('RECOVERY-FAIL', 5, refs);
  const unavailableOrder = await createOrder('RECOVERY-FAIL-A', [{ product: unavailableProduct, quantity: 4 }], 400);
  await rpc('reserve_order_inventory', { p_order_id: unavailableOrder.id });
  await rpc('release_order_inventory', { p_order_id: unavailableOrder.id, p_release_status: 'RELEASED' });
  const competingOrder = await createOrder('RECOVERY-FAIL-B', [{ product: unavailableProduct, quantity: 5 }], 500);
  await rpc('reserve_order_inventory', { p_order_id: competingOrder.id });
  const unavailablePayment = await createPayment(unavailableOrder.id, 'recovery-fail', 400);
  const unavailableBefore = JSON.stringify(await snapshot(unavailableOrder.id, unavailableProduct.id, unavailablePayment.id));
  const unavailableResult = await admin.rpc('finalize_razorpay_payment', {
    p_gateway_reference: unavailablePayment.gateway_reference,
    p_transaction_id: `pay_${prefix}_recovery-fail`,
    p_amount: 400,
    p_currency: 'INR'
  });
  equal('released reservation without stock fails closed', unavailableResult.error?.code, '23514');
  equal('failed released-reservation recovery has no partial commit', JSON.stringify(await snapshot(unavailableOrder.id, unavailableProduct.id, unavailablePayment.id)), unavailableBefore);

  const convergenceProduct = await createProduct('CONVERGENCE', 20, refs);
  for (const sequence of ['callback-first', 'webhook-first']) {
    const order = await createOrder(sequence.toUpperCase(), [{ product: convergenceProduct, quantity: 4 }], 400);
    await rpc('reserve_order_inventory', { p_order_id: order.id });
    const payment = await createPayment(order.id, sequence, 400);
    const args = { p_gateway_reference: payment.gateway_reference, p_transaction_id: `pay_${prefix}_${sequence}`, p_amount: 400, p_currency: 'INR' };
    const first = await rpc('finalize_razorpay_payment', args);
    const second = await rpc('finalize_razorpay_payment', args);
    const duplicate = await rpc('finalize_razorpay_payment', args);
    equal(`${sequence} first arrival finalizes`, first.replay, false);
    equal(`${sequence} second arrival replays`, second.replay, true);
    equal(`${sequence} duplicate arrival replays`, duplicate.replay, true);
    equal(`${sequence} consumes one reservation`, (await reservation(order.id)).status, 'CONSUMED');
  }
  equal('callback/webhook sequences decrement shared stock exactly twice', (await inventory(convergenceProduct.id)).quantity, 12);
  equal('callback/webhook sequences leave no reserved stock', (await inventory(convergenceProduct.id)).reserved_quantity, 0);

  const temporaryProduct = await createProduct('TEMP-RECOVERY', 10, refs);
  const temporaryOrder = await createOrder('TEMP-RECOVERY', [{ product: temporaryProduct, quantity: 4 }], 400);
  await rpc('reserve_order_inventory', { p_order_id: temporaryOrder.id });
  const temporaryPayment = await createPayment(temporaryOrder.id, 'temp-recovery', 400);
  const temporaryFailure = await admin.rpc('finalize_razorpay_payment', {
    p_gateway_reference: temporaryPayment.gateway_reference,
    p_transaction_id: `pay_${prefix}_temporary`,
    p_amount: 400,
    p_currency: 'USD'
  });
  equal('temporary captured-payment finalization error leaves payment pending', temporaryFailure.error?.code, '23514');
  equal('retry after temporary failure succeeds once', (await rpc('finalize_razorpay_payment', {
    p_gateway_reference: temporaryPayment.gateway_reference,
    p_transaction_id: `pay_${prefix}_temporary`,
    p_amount: 400,
    p_currency: 'INR'
  })).replay, false);
  equal('post-recovery retry is idempotent', (await rpc('finalize_razorpay_payment', {
    p_gateway_reference: temporaryPayment.gateway_reference,
    p_transaction_id: `pay_${prefix}_temporary`,
    p_amount: 400,
    p_currency: 'INR'
  })).replay, true);

  const controllerSource = fs.readFileSync(path.join(process.cwd(), 'src/controllers/payment.controller.ts'), 'utf8');
  check('captured callback returns recoverable processing response', /status: 'processing'[\s\S]*recoverable: true[\s\S]*statusCode: 202/.test(controllerSource));

  process.env.RAZORPAY_WEBHOOK_SECRET = `secret-${runId}`;
  const { createServer } = await import('./server.js');
  const app = createServer();
  const activeServer = app.listen(0, '127.0.0.1');
  server = activeServer;
  await once(activeServer, 'listening');
  const port = (activeServer.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}/api/v1/payments`;
  const rawWebhook = JSON.stringify({ event: 'sprint4c.test' });
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawWebhook).digest('hex');
  check('raw-body signature helper accepts exact bytes', verifyRazorpayWebhookSignature(Buffer.from(rawWebhook), signature, process.env.RAZORPAY_WEBHOOK_SECRET));
  const validWebhook = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature }, body: rawWebhook });
  equal('valid signed public webhook is accepted without browser auth', validWebhook.status, 200);
  check('valid webhook response does not expose secret', !(await validWebhook.text()).includes(process.env.RAZORPAY_WEBHOOK_SECRET));
  const invalidWebhook = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': '0'.repeat(64) }, body: rawWebhook });
  equal('invalid webhook signature is rejected', invalidWebhook.status, 400);
  const modifiedWebhook = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature }, body: `${rawWebhook} ` });
  equal('modified body with old signature is rejected', modifiedWebhook.status, 400);
  const missingWebhook = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: rawWebhook });
  equal('missing webhook signature is rejected', missingWebhook.status, 400);

  const privacyProduct = await createProduct('PRIVACY', 1, refs);
  const privacyOrder = await createOrder('PRIVACY', [{ product: privacyProduct, quantity: 1 }]);
  const { error: addressError } = await admin.from('order_addresses').insert({
    order_id: privacyOrder.id,
    address_type: 'SHIPPING',
    full_name: 'Private Fixture',
    phone: '9999999999',
    address_line_1: 'PRIVATE ADDRESS',
    city: 'Private City',
    state: 'Private State',
    postal_code: '000000',
    country: 'India'
  });
  if (addressError) throw addressError;
  const privacyResponse = await fetch(`${base}/order-status/${privacyOrder.id}`);
  equal('public order status remains available for guest checkout', privacyResponse.status, 200);
  const privacyBody = await privacyResponse.text();
  for (const privateValue of [privacyOrder.id, profileId!, privacyProduct.id, '9999999999', 'PRIVATE ADDRESS', 'PRIVATE-NOTE', privacyProduct.sku]) {
    check(`order status omits private value ${privateValue.slice(0, 12)}`, !privacyBody.includes(privateValue));
  }
  check('order status includes only expected public status fields', /orderNumber/.test(privacyBody) && /paymentStatus/.test(privacyBody));
}

main()
  .then(async () => {
    await cleanup();
    const [products, orders, profiles] = await Promise.all([
      admin.from('products').select('id', { count: 'exact', head: true }).like('sku', `${prefix}%`),
      admin.from('orders').select('id', { count: 'exact', head: true }).like('order_number', `${prefix}%`),
      admin.from('profiles').select('id', { count: 'exact', head: true }).eq('email', email)
    ]);
    equal('all disposable products were removed', products.count, 0);
    equal('all disposable orders were removed', orders.count, 0);
    equal('all disposable profiles were removed', profiles.count, 0);
    console.log(`Sprint 4C live payment integrity tests: ${passed} passed`);
  })
  .catch(async (error) => {
    console.error('Sprint 4C live test failed:', error instanceof Error ? error.message : error);
    try { await cleanup(); } catch (cleanupError) {
      console.error('Sprint 4C cleanup failed:', cleanupError instanceof Error ? cleanupError.message : cleanupError);
    }
    process.exitCode = 1;
  });
