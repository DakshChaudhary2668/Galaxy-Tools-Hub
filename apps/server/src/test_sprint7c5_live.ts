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
const runId = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
const sku = `S7C5-${runId}`;
const brandName = `S7C5 Brand ${runId}`;
const couponCode = `S7C5${runId.replace(/[^A-Z0-9]/g, '')}`;
const imagePaths: string[] = [];
let productId: string | undefined;
let brandId: string | undefined;
let couponId: string | undefined;
let server: Server | undefined;
let token = '';
let passed = 0;

function ok(name: string, condition: unknown): void {
  assert.ok(condition, name);
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

async function cleanup(): Promise<void> {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  if (couponId) await admin.from('coupons').delete().eq('id', couponId);
  if (imagePaths.length) await admin.storage.from('product-images').remove(imagePaths);
  if (productId) {
    await admin.from('product_images').delete().eq('product_id', productId);
    await admin.from('inventory').delete().eq('product_id', productId);
    await admin.from('products').delete().eq('id', productId);
  }
  if (brandId) await admin.from('brands').delete().eq('id', brandId).eq('name', brandName);
  await admin.auth.signOut();
}

async function main(): Promise<void> {
  const { data: adminUser, error: adminError } = await admin
    .from('admin_users').select('email').eq('status', 'ACTIVE').limit(1).single();
  if (adminError || !adminUser?.email) throw adminError || new Error('No active admin account available');

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: adminUser.email });
  if (linkError || !link.properties?.hashed_token) throw linkError || new Error('Admin test session could not be created');
  const helper = createClient(url!, serviceKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: session, error: sessionError } = await helper.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
  if (sessionError || !session.session?.access_token) throw sessionError || new Error('Admin test session could not be verified');
  token = session.session.access_token;

  const [{ data: category }, { data: vendor }] = await Promise.all([
    admin.from('categories').select('id').eq('slug', 'testing-equipment').single(),
    admin.from('vendors').select('id').limit(1).single()
  ]);
  if (!category || !vendor) throw new Error('Catalog reference data is incomplete');

  const { createServer } = await import('./server.js');
  const activeServer = createServer().listen(0, '127.0.0.1');
  server = activeServer;
  await once(activeServer, 'listening');
  const base = `http://127.0.0.1:${(activeServer.address() as AddressInfo).port}/api/v1`;

  async function api(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers }
    });
    const body = await response.json();
    return { response, body };
  }

  const created = await api('/products/admin', {
    method: 'POST',
    body: JSON.stringify({
      name: `Disposable ${sku}`, sku, slug: sku.toLowerCase(), source_model_no: sku,
      category_id: category.id, custom_brand_name: brandName, source_vendor_id: vendor.id,
      price: 100, hsn_code: '9030', tax_rate: 18, stock: 2, lowStockThreshold: 1,
      is_active: false, is_purchasable: false, is_featured: true, show_on_homepage: true
    })
  });
  ok('custom-brand product creation succeeds', created.response.status === 201 && created.body.data?.id);
  productId = created.body.data.id;
  brandId = created.body.data.brand_id;

  const reused = await api(`/products/admin/${productId}`, {
    method: 'PUT', body: JSON.stringify({ custom_brand_name: `  ${brandName.toLowerCase()}  ` })
  });
  ok('case/spacing-equivalent custom brand is reused', reused.response.ok && reused.body.data.brand_id === brandId);
  const { count: brandCount } = await admin.from('brands').select('id', { count: 'exact', head: true }).eq('id', brandId!);
  ok('duplicate brand row is not created', brandCount === 1);

  const onHomepage = await api(`/products?active=false&homepage=true&search=${encodeURIComponent(sku)}`);
  ok('homepage placement filter includes opted-in inactive fixture when explicitly requested', onHomepage.body.data?.some((item: { id: string }) => item.id === productId));
  await api(`/products/admin/${productId}`, { method: 'PUT', body: JSON.stringify({ show_on_homepage: false }) });
  const offHomepage = await api(`/products?active=false&homepage=true&search=${encodeURIComponent(sku)}`);
  const stillCatalogued = await api(`/products?active=false&search=${encodeURIComponent(sku)}`);
  ok('homepage opt-out does not remove product from catalog queries', !offHomepage.body.data?.length && stillCatalogued.body.data?.some((item: { id: string }) => item.id === productId));

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  async function uploadImage(label: string) {
    const signed = await api('/storage/product-image-upload-url', {
      method: 'POST', body: JSON.stringify({ product_id: productId, mime_type: 'image/png', file_size: png.length, extension: 'png' })
    });
    assert.equal(signed.response.status, 200);
    imagePaths.push(signed.body.data.path);
    const upload = await fetch(signed.body.data.signedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: png });
    assert.equal(upload.ok, true);
    const completed = await api(`/products/admin/${productId}/images/complete`, {
      method: 'POST', body: JSON.stringify({ storage_path: signed.body.data.path, alt_text: label })
    });
    assert.equal(completed.response.status, 201);
    return completed.body.data;
  }

  const firstImage = await uploadImage('first');
  const secondImage = await uploadImage('second');
  const afterUpload = await api(`/products/${productId}/images`);
  ok('two signed product images append without replacement', afterUpload.body.data?.length === 2 && firstImage.is_primary && !secondImage.is_primary);

  const primary = await api(`/products/admin/${productId}/images/${secondImage.id}/primary`, { method: 'PUT', body: '{}' });
  ok('second image can become the sole primary', primary.response.ok && primary.body.data?.is_primary === true);
  const removed = await api(`/products/admin/${productId}/images/${firstImage.id}`, { method: 'DELETE' });
  const afterRemove = await api(`/products/${productId}/images`);
  ok('individual image removal preserves the selected primary', removed.response.ok && afterRemove.body.data?.length === 1 && afterRemove.body.data[0].id === secondImage.id && afterRemove.body.data[0].is_primary);
  imagePaths.splice(imagePaths.indexOf(firstImage.storage_path), 1);

  const unauthorizedCoupon = await fetch(`${base}/coupons/admin`);
  ok('coupon admin rejects unauthenticated requests', unauthorizedCoupon.status === 401);
  const coupon = await api('/coupons/admin', {
    method: 'POST', body: JSON.stringify({ code: couponCode, discount_type: 'PERCENTAGE', discount_value: 10, minimum_order_amount: 100, usage_limit: 2, is_active: true })
  });
  ok('admin can create a disposable constrained coupon', coupon.response.status === 201 && coupon.body.data?.id);
  couponId = coupon.body.data.id;
  const couponUpdate = await api(`/coupons/admin/${couponId}`, { method: 'PUT', body: JSON.stringify({ is_active: false }) });
  ok('admin can deactivate a coupon', couponUpdate.response.ok && couponUpdate.body.data?.is_active === false);
  const couponDelete = await api(`/coupons/admin/${couponId}`, { method: 'DELETE' });
  ok('unused disposable coupon can be deleted', couponDelete.response.ok);
  couponId = undefined;

  const finalImageDelete = await api(`/products/admin/${productId}/images/${secondImage.id}`, { method: 'DELETE' });
  ok('final managed image is removed through the scoped endpoint', finalImageDelete.response.ok);
  imagePaths.splice(imagePaths.indexOf(secondImage.storage_path), 1);
}

main()
  .then(async () => {
    await cleanup();
    const [{ count: products }, { count: brands }, { count: coupons }, storage] = await Promise.all([
      admin.from('products').select('id', { count: 'exact', head: true }).eq('sku', sku),
      admin.from('brands').select('id', { count: 'exact', head: true }).eq('name', brandName),
      admin.from('coupons').select('id', { count: 'exact', head: true }).eq('code', couponCode),
      admin.storage.from('product-images').list(`products/${productId}`)
    ]);
    ok('all Sprint 7C.5 database and storage fixtures are removed', products === 0 && brands === 0 && coupons === 0 && !storage.error && storage.data.length === 0);
    console.log(`Sprint 7C.5 live tests: ${passed} passed`);
  })
  .catch(async (error) => {
    console.error('Sprint 7C.5 live test failed:', error instanceof Error ? error.message : error);
    try { await cleanup(); } catch (cleanupError) { console.error('Cleanup failed:', cleanupError); }
    process.exitCode = 1;
  });
