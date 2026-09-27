import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Supabase test environment is not configured');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const id = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const email = `sprint4c-http-${id}@example.invalid`;
const password = `S4c-${crypto.randomBytes(12).toString('hex')}!`;
const secret = `webhook-${crypto.randomBytes(16).toString('hex')}`;
let authUserId: string | undefined;
let profileId: string | undefined;
let orderId: string | undefined;
let server: Server | undefined;
let passed = 0;

function equal(name: string, actual: unknown, expected: unknown): void {
  assert.deepEqual(actual, expected, name);
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

function check(name: string, condition: unknown): void {
  assert.ok(condition, name);
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

async function cleanup(): Promise<void> {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  if (orderId) {
    for (const table of ['order_items', 'order_addresses']) {
      const { error } = await admin.from(table).delete().eq('order_id', orderId);
      if (error) throw error;
    }
    const { error } = await admin.from('orders').delete().eq('id', orderId);
    if (error) throw error;
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
      full_name: 'Sprint 4C HTTP Fixture',
      email,
      account_type: 'CUSTOMER',
      is_active: true
    }).select('id').single();
    if (error || !data) throw error || new Error('Test profile was not created');
    profileId = data.id;
  }

  const { data: order, error: orderError } = await admin.from('orders').insert({
    order_number: `S4C-HTTP-${id}`.slice(0, 50),
    user_id: profileId,
    status: 'PENDING',
    payment_status: 'PENDING',
    subtotal: 100,
    discount_amount: 0,
    tax_amount: 0,
    shipping_amount: 0,
    total_amount: 100,
    currency: 'INR',
    customer_notes: `PRIVATE-NOTE-${id}`
  }).select('id').single();
  if (orderError || !order) throw orderError || new Error('Test order was not created');
  orderId = order.id;

  const [item, address] = await Promise.all([
    admin.from('order_items').insert({
      order_id: orderId,
      product_id: null,
      product_name: `PRIVATE-ITEM-${id}`,
      sku: `PRIVATE-SKU-${id}`,
      hsn_code: '9999',
      quantity: 1,
      unit_price: 100,
      discount_amount: 0,
      tax_rate: 18,
      tax_amount: 0,
      total_amount: 100
    }),
    admin.from('order_addresses').insert({
      order_id: orderId,
      address_type: 'SHIPPING',
      full_name: 'Private Fixture',
      phone: '9999999999',
      address_line_1: `PRIVATE-ADDRESS-${id}`,
      city: 'Private City',
      state: 'Private State',
      postal_code: '000000',
      country: 'India'
    })
  ]);
  if (item.error) throw item.error;
  if (address.error) throw address.error;

  process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  const { createServer } = await import('./server.js');
  const activeServer = createServer().listen(0, '127.0.0.1');
  server = activeServer;
  await once(activeServer, 'listening');
  const port = (activeServer.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}/api/v1/payments`;

  const raw = JSON.stringify({ event: 'sprint4c.test' });
  const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const valid = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature }, body: raw });
  equal('valid signed webhook needs no browser auth', valid.status, 200);
  check('valid webhook response omits secret', !(await valid.text()).includes(secret));

  const invalid = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': '0'.repeat(64) }, body: raw });
  equal('invalid webhook signature is rejected', invalid.status, 400);
  const modified = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature }, body: `${raw} ` });
  equal('modified webhook body is rejected', modified.status, 400);
  const missing = await fetch(`${base}/webhook/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw });
  equal('missing webhook signature is rejected', missing.status, 400);

  const privacy = await fetch(`${base}/order-status/${orderId}`);
  equal('minimal guest order status remains available', privacy.status, 200);
  const body = await privacy.text();
  for (const privateValue of [orderId!, profileId!, authUserId!, '9999999999', `PRIVATE-ADDRESS-${id}`, `PRIVATE-NOTE-${id}`, `PRIVATE-ITEM-${id}`, `PRIVATE-SKU-${id}`]) {
    check(`guest status omits ${privateValue.slice(0, 12)}`, !body.includes(privateValue));
  }
  check('guest status includes public order state', body.includes('orderNumber') && body.includes('paymentStatus'));
}

main()
  .then(async () => {
    await cleanup();
    const { count, error } = await admin.from('orders').select('id', { count: 'exact', head: true }).like('order_number', 'S4C-HTTP-%');
    if (error) throw error;
    equal('HTTP fixture cleanup removed test order', count, 0);
    console.log(`Sprint 4C HTTP security/privacy tests: ${passed} passed`);
  })
  .catch(async (error) => {
    console.error('Sprint 4C HTTP test failed:', error instanceof Error ? error.message : error);
    try { await cleanup(); } catch (cleanupError) {
      console.error('Sprint 4C HTTP cleanup failed:', cleanupError instanceof Error ? cleanupError.message : cleanupError);
    }
    process.exitCode = 1;
  });
