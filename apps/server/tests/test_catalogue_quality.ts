import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSyncPlan, SUPPORTED_BRANDS } from '../src/scripts/sync-catalogue-partners';
import { findManifestMatches } from '../src/scripts/sync-fluke-quality';

const root = fs.existsSync(path.join(process.cwd(), 'apps')) ? process.cwd() : path.resolve(process.cwd(), '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;
const test = (name: string, run: () => void) => {
  run();
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
};

test('canonical partner plan reuses normalized names and deactivates unsupported rows', () => {
  const plan = buildSyncPlan(
    [{ id: 'fluke', name: 'FLUKE', slug: 'old', logo_url: null, is_active: true }, { id: 'legacy', name: 'Legacy', slug: 'legacy', logo_url: null, is_active: true }],
    [{ id: 'fluke', name: 'Fluke', code: 'FLUKE', is_active: true }, { id: 'legacy', name: 'Legacy', code: 'LEGACY', is_active: true }]
  );
  assert.equal(SUPPORTED_BRANDS.length, 16);
  assert.equal(plan.brandPlans.find(({ name }) => name === 'Fluke')?.existing?.id, 'fluke');
  assert.equal(plan.vendorPlans.find(({ name }) => name === 'Fluke')?.existing?.id, 'fluke');
  assert.deepEqual(plan.legacyBrands.map(({ name }) => name), ['Legacy']);
  assert.deepEqual(plan.legacyVendors.map(({ name }) => name), ['Legacy']);
});

test('Fluke matching prefers exact model and SKU over a similar product name', () => {
  const products = [
    { id: 'plus', name: 'Fluke 301A Clamp Meter', sku: 'GTH-FLU-301A-PLUS', slug: 'fluke-301a-plus-clamp-meter', source_model_no: '301A+', brand_id: 'fluke', weight_grams: null, specifications: null, is_purchasable: false },
    { id: 'base', name: 'Fluke 301A Clamp Meter', sku: 'GTH-FLU-301A', slug: 'fluke-301a-clamp-meter', source_model_no: '301A', brand_id: 'fluke', weight_grams: 132, specifications: null, is_purchasable: false }
  ];
  const item = { model: '301A', sku: 'GTH-FLU-301A', slug: 'fluke-301a-clamp-meter', displayName: 'Fluke 301A Clamp Meter' };
  assert.deepEqual(findManifestMatches(products, item as never).map(({ id }) => id), ['base']);
});

test('brand and supplier APIs expose only active options', () => {
  assert.match(read('apps/server/src/controllers/brand.controller.ts'), /\.eq\('is_active', true\)/);
  assert.match(read('apps/server/src/controllers/vendor.controller.ts'), /\.eq\('is_active', true\)/);
  assert.doesNotMatch(read('apps/web/src/app/admin/(dashboard)/products/new/page.tsx'), /__other__/);
  assert.match(read('apps/web/src/app/admin/(dashboard)/products/new/page.tsx'), /useVendors/);
  assert.match(read('apps/web/src/app/admin/(dashboard)/products/[id]/edit/page.tsx'), /useVendors/);
});

test('storefront brands come from the API instead of a duplicate hard-coded list', () => {
  const brands = read('apps/web/src/components/BrandsStrip/BrandsStrip.tsx');
  assert.match(brands, /useBrands/);
  assert.match(brands, /brand\.logo_url/);
  assert.doesNotMatch(brands, /brandLogos|\/images\/brands\/fluke/);
});

test('dashboard refresh guards repeated clicks and renders errors', () => {
  const dashboard = read('apps/web/src/app/admin/(dashboard)/dashboard/page.tsx');
  assert.match(dashboard, /onClick=\{\(\) => fetchData\(range\)\}/);
  assert.match(dashboard, /disabled=\{loading\}/);
  assert.match(dashboard, /Refreshing\.\.\./);
  assert.match(dashboard, /setError\(msg\)/);
  assert.match(read('apps/server/src/routes/analytics.routes.ts'), /dashboard-summary[\s\S]*adminAuthGuard/);
});

test('product image regions contain images and use a generic fallback', () => {
  const card = read('apps/web/src/components/ProductCard/ProductCard.tsx');
  const cardStyles = read('apps/web/src/components/ProductCard/ProductCard.module.scss');
  assert.match(cardStyles, /aspect-ratio:\s*1\s*\/\s*0\.92/);
  assert.match(cardStyles, /object-fit:\s*contain/);
  assert.match(card, /Product image unavailable/);
  assert.doesNotMatch(card, /placeholder\.jpg/);
});

test('authoritative weight enrichment remains positive and unresolved kits stay null', () => {
  const manifest = JSON.parse(read('scripts/data/fluke-retail-price-list-2026-07-04.json')) as { products: Array<{ model: string; weightGrams: number | null; weightConfidence: string }> };
  const byModel = new Map(manifest.products.map((item) => [item.model, item]));
  assert.equal(byModel.get('319')?.weightGrams, 384);
  assert.equal(byModel.get('404E')?.weightGrams, 100);
  assert.equal(byModel.get('9062')?.weightGrams, 150);
  assert.equal(byModel.get('101 Kit')?.weightGrams, null);
  assert.ok(manifest.products.every(({ weightGrams }) => weightGrams === null || weightGrams > 0));
});

assert.equal(passed, 7);
console.log(`Catalogue quality focused tests: ${passed} passed`);
