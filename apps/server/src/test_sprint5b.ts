import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ServerEnvSchema } from '@galaxy/config';

const root = fs.existsSync(path.join(process.cwd(), 'supabase')) ? process.cwd() : path.resolve(process.cwd(), '../..');
let passed = 0;

function test(name: string, run: () => void): void {
  run();
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

const serverEnv = {
  NODE_ENV: 'production',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  RAZORPAY_KEY_ID: 'rzp_live_placeholder',
  RAZORPAY_KEY_SECRET: 'placeholder',
  RAZORPAY_WEBHOOK_SECRET: 'placeholder'
};

test('production rejects localhost CORS', () => {
  assert.equal(ServerEnvSchema.safeParse({ ...serverEnv, CORS_ORIGIN: 'http://localhost:3000' }).success, false);
});
test('production accepts an HTTPS storefront origin', () => {
  assert.equal(ServerEnvSchema.safeParse({ ...serverEnv, CORS_ORIGIN: 'https://shop.example.com' }).success, true);
});
test('production rejects non-HTTPS CORS', () => {
  assert.equal(ServerEnvSchema.safeParse({ ...serverEnv, CORS_ORIGIN: 'http://shop.example.com' }).success, false);
});
test('web API configuration has no implicit localhost fallback', () => {
  const apiClient = fs.readFileSync(path.join(root, 'apps/web/src/services/api.ts'), 'utf8');
  assert.match(apiClient, /NEXT_PUBLIC_API_URL is required/);
  assert.doesNotMatch(apiClient, /\?\? 'http:\/\/localhost/);
});

for (const name of ['config', 'constants', 'types', 'utils', 'ui']) {
  test(`@galaxy/${name} exports compiled JavaScript and declarations`, () => {
    const dir = path.join(root, 'packages', name);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(manifest.main, './dist/index.js');
    assert.equal(manifest.types, './dist/index.d.ts');
    assert.equal(manifest.exports, './dist/index.js');
    assert.equal(manifest.type, 'commonjs');
    assert.ok(fs.existsSync(path.join(dir, 'dist/index.js')));
    assert.ok(fs.existsSync(path.join(dir, 'dist/index.d.ts')));
  });
}

const cron = fs.readFileSync(path.join(root, 'supabase/migrations/20260920144322_schedule_reservation_expiry.sql'), 'utf8');
test('reservation cron has the stable five-minute database-function schedule', () => {
  assert.match(cron, /create extension if not exists pg_cron/i);
  assert.match(cron, /expire-inventory-reservations-every-5-minutes/);
  assert.match(cron, /'\*\/5 \* \* \* \*'/);
  assert.match(cron, /select public\.expire_inventory_reservations\(\)/i);
});

const apiRoutes = fs.readFileSync(path.join(root, 'apps/server/src/routes/index.ts'), 'utf8');
const productRoutes = fs.readFileSync(path.join(root, 'apps/server/src/routes/product.routes.ts'), 'utf8');
const adminLayout = fs.readFileSync(path.join(root, 'apps/web/src/app/admin/(dashboard)/layout.tsx'), 'utf8');
test('coupon administration is mounted while variants remain deferred', () => {
  assert.match(apiRoutes, /couponRouter/);
  assert.doesNotMatch(productRoutes, /variant/i);
  assert.match(adminLayout, /admin\/coupons/i);
});

assert.equal(passed, 11);
console.log(`Sprint 5B packaging tests: ${passed} passed`);
