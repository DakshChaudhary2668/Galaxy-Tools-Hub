import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CreateCouponSchema, CreateProductSchema } from '@galaxy/types';

const root = fs.existsSync(path.join(process.cwd(), 'supabase')) ? process.cwd() : path.resolve(process.cwd(), '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;
const test = (name: string, run: () => void) => { run(); passed += 1; console.log(`ok ${passed} - ${name}`); };

const categoryMenu = read('apps/web/src/components/CategoryMegaMenu/CategoryMegaMenu.tsx');
const migration = read('supabase/migrations/20261004090000_sprint7c5_merchandising_coupons.sql');
const productController = read('apps/server/src/controllers/product.controller.ts');
const productRoutes = read('apps/server/src/routes/product.routes.ts');
const couponRoutes = read('apps/server/src/routes/coupon.routes.ts');

test('active category navigation contains no legacy storefront URL', () => {
  assert.doesNotMatch(categoryMenu, /https?:\/\/galaxytoolshub\.com/i);
  assert.match(categoryMenu, /\/products\?category=/);
});
test('custom brand can replace brand_id during product creation', () => {
  const parsed = CreateProductSchema.safeParse({
    category_id: '44444444-4444-4444-a444-444444444443', source_vendor_id: '22222222-2222-4222-a222-222222222221',
    custom_brand_name: '  New Brand  ', sku: 'TEST', source_model_no: 'TEST', name: 'Test', slug: 'test',
    hsn_code: '9030', price: 100, tax_rate: 18
  });
  assert.equal(parsed.success, true);
});
test('homepage visibility is independent from active and purchasable', () => {
  assert.match(migration, /add column if not exists show_on_homepage/i);
});
test('image completion appends images with a six-image limit', () => {
  assert.match(productController, /MAX_PRODUCT_IMAGES = 6/);
  assert.doesNotMatch(productController, /safely cleanup previous image records/);
});
test('individual image deletion is scoped to product and image IDs', () => {
  assert.match(productController, /\.eq\('id', imageId\)[\s\S]*\.eq\('product_id', productId\)/);
});
test('primary image mutation uses a restricted transaction RPC', () => {
  assert.match(migration, /set_primary_product_image/);
  assert.match(migration, /revoke all on function[\s\S]*from public, anon, authenticated/i);
});
test('managed image routes require admin authentication and RBAC', () => {
  assert.match(productRoutes, /images\/:imageId\/primary[\s\S]*adminAuthGuard[\s\S]*rbacGuard/);
});
test('coupon percentage cannot exceed 100', () => {
  assert.equal(CreateCouponSchema.safeParse({ code: 'TOO-MUCH', discount_type: 'PERCENTAGE', discount_value: 101, is_active: true }).success, false);
});
test('coupon dates must form a valid range', () => {
  assert.equal(CreateCouponSchema.safeParse({ code: 'DATES', discount_type: 'FIXED', discount_value: 10, starts_at: '2026-10-05T00:00:00.000Z', expires_at: '2026-10-04T00:00:00.000Z', is_active: true }).success, false);
});
test('coupon schema has no seed inserts', () => {
  assert.doesNotMatch(migration, /insert\s+into\s+public\.coupons/i);
});
test('coupon endpoints are admin and RBAC protected', () => {
  assert.match(couponRoutes, /couponRouter\.get\('\/admin', adminAuthGuard, adminRoles/);
  assert.doesNotMatch(couponRoutes, /couponRouter\.get\('\/'/);
});

assert.equal(passed, 11);
console.log(`Sprint 7C.5 focused tests: ${passed} passed`);
