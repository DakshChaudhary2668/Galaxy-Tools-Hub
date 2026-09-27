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
const runId = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const prefix = `S5A-${runId}`.toUpperCase();
const productIds: string[] = [];
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

async function cleanup(): Promise<void> {
  if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  if (!productIds.length) return;
  for (const table of ['product_images', 'inventory']) {
    const { error } = await admin.from(table).delete().in('product_id', productIds);
    if (error) throw error;
  }
  const { error } = await admin.from('products').delete().in('id', productIds);
  if (error) throw error;
}

async function inventoryReport(): Promise<void> {
  const [{ data: products, error: productError }, { data: inventory, error: inventoryError }] = await Promise.all([
    admin.from('products').select('id, sku, name').eq('is_active', true).eq('is_purchasable', true),
    admin.from('inventory').select('product_id')
  ]);
  if (productError) throw productError;
  if (inventoryError) throw inventoryError;

  const stocked = new Set((inventory || []).map((row) => row.product_id));
  const missing = (products || []).filter((product) => !stocked.has(product.id));
  const watched = new Set(['GTH-BOS-GBH228', 'GTH-FLU-179', 'GTH-MAK-GA5030', 'GTH-TAP-S14H']);

  console.log(`inventory sellable=${products?.length || 0} with_rows=${(products || []).length - missing.length} missing=${missing.length}`);
  for (const product of missing) {
    console.log(`inventory missing sku=${product.sku} name=${product.name}${watched.has(product.sku) ? ' previously_reported=true' : ''}`);
  }
}

async function main(): Promise<void> {
  await inventoryReport();

  const [{ data: category }, { data: brand }, { data: vendor }] = await Promise.all([
    admin.from('categories').select('id').limit(1).single(),
    admin.from('brands').select('id').limit(1).single(),
    admin.from('vendors').select('id').limit(1).single()
  ]);
  if (!category || !brand || !vendor) throw new Error('Catalog reference data is incomplete');

  const fixtures = [
    { sku: `${prefix}-ALPHA`, name: `${prefix} Precision Drill Alpha`, price: 3201 },
    { sku: `${prefix}-BETA`, name: `${prefix} Precision Drill Beta`, price: 1703 },
    { sku: `${prefix}-METER`, name: `${prefix} Clamp Meter`, price: 2407 }
  ];

  const { data: inserted, error: insertError } = await admin.from('products').insert(fixtures.map((fixture) => ({
    ...fixture,
    category_id: category.id,
    brand_id: brand.id,
    source_vendor_id: vendor.id,
    source_model_no: fixture.sku,
    slug: fixture.sku.toLowerCase(),
    description: `Disposable ${prefix} search fixture`,
    meta_keywords: `orbital ${prefix}`,
    product_type: 'PRODUCT',
    pricing_type: 'FIXED',
    hsn_code: '9999',
    tax_rate: 18,
    minimum_order_quantity: 1,
    is_purchasable: false,
    is_featured: false,
    is_active: true
  }))).select('id, sku, name, price');
  if (insertError || !inserted) throw insertError || new Error('Search fixtures were not created');
  productIds.push(...inserted.map((product) => product.id));

  const { createServer } = await import('./server.js');
  const activeServer = createServer().listen(0, '127.0.0.1');
  server = activeServer;
  await once(activeServer, 'listening');
  const base = `http://127.0.0.1:${(activeServer.address() as AddressInfo).port}/api/v1/products`;

  async function search(params: Record<string, string>): Promise<{ status: number; body: any }> {
    const response = await fetch(`${base}?${new URLSearchParams(params)}`);
    return { status: response.status, body: await response.json() };
  }

  const exact = await search({ search: fixtures[0].name });
  equal('exact product name search returns one fixture', exact.body.meta.total, 1);
  equal('exact product name search returns the expected SKU', exact.body.data[0].sku, fixtures[0].sku);

  const partial = await search({ search: 'Precision Drill' });
  check('partial product name search returns both drill fixtures', fixtures.slice(0, 2).every(({ sku }) => partial.body.data.some((p: any) => p.sku === sku)));

  const caseInsensitive = await search({ search: fixtures[2].name.toLowerCase() });
  equal('lowercase query matches uppercase product name', caseInsensitive.body.data[0].sku, fixtures[2].sku);

  const sku = await search({ search: fixtures[1].sku.toLowerCase() });
  equal('SKU search is case insensitive', sku.body.data[0].sku, fixtures[1].sku);

  const keyword = await search({ search: 'orbital', limit: '100' });
  check('product keyword search finds every fixture', fixtures.every(({ sku: fixtureSku }) => keyword.body.data.some((p: any) => p.sku === fixtureSku)));

  const nonexistent = await search({ search: `${prefix}-DOES-NOT-EXIST` });
  equal('nonexistent query has no results', nonexistent.body.meta.total, 0);

  const blank = await search({ search: '' });
  equal('blank query is accepted', blank.status, 200);
  const whitespace = await search({ search: '     ' });
  equal('whitespace-only query is accepted without a filter error', whitespace.status, 200);

  for (const query of [',().:"\\%_', 'or(id.eq.1)', '"quoted"']) {
    const special = await search({ search: query });
    equal(`special query is safely handled: ${query}`, special.status, 200);
    equal(`special query does not broaden results: ${query}`, special.body.data.length, 0);
  }

  const normalized = await search({ search: `  ${prefix}   Clamp   Meter  ` });
  equal('leading, trailing, and repeated spaces are normalized', normalized.body.data[0].sku, fixtures[2].sku);

  const filtered = await search({ search: 'Precision Drill', category: category.id, brand: brand.id });
  equal('search composes with category and brand filters', filtered.body.meta.total, 2);

  const sorted = await search({ search: 'Precision Drill', sort: 'price_asc' });
  equal('search composes with sorting', sorted.body.data[0].sku, fixtures[1].sku);

  const firstPage = await search({ search: prefix, sort: 'price_asc', page: '1', limit: '1' });
  const secondPage = await search({ search: prefix, sort: 'price_asc', page: '2', limit: '1' });
  equal('search pagination reports all fixtures', firstPage.body.meta.total, 3);
  check('search pagination returns distinct pages', firstPage.body.data[0].sku !== secondPage.body.data[0].sku);

  const tooLong = await search({ search: 'x'.repeat(101) });
  equal('overlong search is rejected', tooLong.status, 400);
}

main()
  .then(async () => {
    await cleanup();
    const { count, error } = await admin.from('products').select('id', { count: 'exact', head: true }).like('sku', 'S5A-%');
    if (error) throw error;
    equal('search fixture cleanup removed all Sprint 5A products', count, 0);
    console.log(`Sprint 5A focused search tests: ${passed} passed`);
  })
  .catch(async (error) => {
    console.error('Sprint 5A search test failed:', error instanceof Error ? error.message : error);
    try { await cleanup(); } catch (cleanupError) {
      console.error('Sprint 5A cleanup failed:', cleanupError instanceof Error ? cleanupError.message : cleanupError);
    }
    process.exitCode = 1;
  });
