import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

type Brand = { id: string; name: string; slug: string; logo_url: string | null; is_active: boolean };
type Vendor = { id: string; name: string; code: string; is_active: boolean };

export const SUPPORTED_BRANDS = [
  ['Beetech', 'beetech', '/images/brands/beetech.png'],
  ['Hioki', 'hioki', '/images/brands/hioki.png'],
  ['HTC', 'htc', '/images/brands/htc.png'],
  ['Fluke', 'fluke', '/images/brands/fluke.png'],
  ['Kyoritsu', 'kyoritsu', '/images/brands/kyoritsu.png'],
  ['Lutron', 'lutron', '/images/brands/lutron.png'],
  ['Kusam-Meco', 'kusam-meco', '/images/brands/kusam-meco.png'],
  ['MECO', 'meco', '/images/brands/meco.png'],
  ['Metravi', 'metravi', '/images/brands/metravi.png'],
  ['Mextech', 'mextech', '/images/brands/mextech.png'],
  ['Mastech', 'mastech', '/images/brands/mastech.png'],
  ['R-Tek', 'r-tek', '/images/brands/r-tek.png'],
  ['Testo', 'testo', '/images/brands/testo.png'],
  ['Rishabh', 'rishabh', '/images/brands/rishabh.png'],
  ['WACO', 'waco', '/images/brands/waco.png'],
  ['UNI-T', 'uni-t', '/images/brands/uni-t.png']
] as const;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const vendorCode = (name: string) => normalize(name).toUpperCase();

export function buildSyncPlan(brands: Brand[], vendors: Vendor[]) {
  const supported = new Set(SUPPORTED_BRANDS.map(([name]) => normalize(name)));
  const brandPlans = SUPPORTED_BRANDS.map(([name, slug, logo_url]) => {
    const matches = brands.filter((brand) => normalize(brand.name) === normalize(name));
    if (matches.length > 1) throw new Error(`Duplicate brand match for ${name}.`);
    return { name, slug, logo_url, existing: matches[0] || null };
  });
  const vendorPlans = SUPPORTED_BRANDS.map(([name]) => {
    const expectedCode = vendorCode(name);
    const matches = vendors.filter((vendor) => normalize(vendor.name) === normalize(name) || normalize(vendor.code) === normalize(expectedCode));
    if (matches.length > 1) throw new Error(`Duplicate vendor match for ${name}.`);
    return { name, code: expectedCode, existing: matches[0] || null };
  });
  return {
    brandPlans,
    vendorPlans,
    legacyBrands: brands.filter((brand) => !supported.has(normalize(brand.name))),
    legacyVendors: vendors.filter((vendor) => !supported.has(normalize(vendor.name)) && !supported.has(normalize(vendor.code)))
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const [{ data: brands, error: brandsError }, { data: vendors, error: vendorsError }, { data: products, error: productsError }] = await Promise.all([
    db.from('brands').select('id,name,slug,logo_url,is_active').order('name'),
    db.from('vendors').select('id,name,code,is_active').order('name'),
    db.from('products').select('id,brand_id,source_vendor_id')
  ]);
  if (brandsError) throw brandsError;
  if (vendorsError) throw vendorsError;
  if (productsError) throw productsError;

  const plan = buildSyncPlan((brands || []) as Brand[], (vendors || []) as Vendor[]);
  const before = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    expectedBrands: SUPPORTED_BRANDS.map(([name]) => name),
    brands: {
      reuse: plan.brandPlans.filter(({ existing }) => existing).map(({ name }) => name),
      create: plan.brandPlans.filter(({ existing }) => !existing).map(({ name }) => name),
      deactivate: plan.legacyBrands.filter(({ is_active }) => is_active).map(({ name }) => name),
      referencedLegacy: plan.legacyBrands.filter((brand) => (products || []).some((product) => product.brand_id === brand.id)).map(({ name }) => name)
    },
    suppliers: {
      reuse: plan.vendorPlans.filter(({ existing }) => existing).map(({ name }) => name),
      create: plan.vendorPlans.filter(({ existing }) => !existing).map(({ name }) => name),
      deactivate: plan.legacyVendors.filter(({ is_active }) => is_active).map(({ name }) => name),
      referencedLegacy: plan.legacyVendors.filter((vendor) => (products || []).some((product) => product.source_vendor_id === vendor.id)).map(({ name }) => name)
    }
  };
  if (!apply) {
    console.log(JSON.stringify(before, null, 2));
    return;
  }

  for (const { name, slug, logo_url, existing } of plan.brandPlans) {
    const payload = { name, slug, logo_url, is_active: true };
    const result = existing
      ? await db.from('brands').update(payload).eq('id', existing.id)
      : await db.from('brands').insert(payload);
    if (result.error) throw result.error;
  }
  if (plan.legacyBrands.length) {
    const { error } = await db.from('brands').update({ is_active: false }).in('id', plan.legacyBrands.map(({ id }) => id));
    if (error) throw error;
  }

  for (const { name, code, existing } of plan.vendorPlans) {
    const payload = { name, code, description: `${name} catalogue supplier`, is_active: true };
    const result = existing
      ? await db.from('vendors').update(payload).eq('id', existing.id)
      : await db.from('vendors').insert(payload);
    if (result.error) throw result.error;
  }
  if (plan.legacyVendors.length) {
    const { error } = await db.from('vendors').update({ is_active: false }).in('id', plan.legacyVendors.map(({ id }) => id));
    if (error) throw error;
  }

  const [{ data: activeBrands, error: verifyBrandsError }, { data: activeVendors, error: verifyVendorsError }] = await Promise.all([
    db.from('brands').select('name').eq('is_active', true).order('name'),
    db.from('vendors').select('name').eq('is_active', true).order('name')
  ]);
  if (verifyBrandsError) throw verifyBrandsError;
  if (verifyVendorsError) throw verifyVendorsError;
  const expected = [...SUPPORTED_BRANDS.map(([name]) => name)].sort((a, b) => a.localeCompare(b));
  const actualBrands = (activeBrands || []).map(({ name }) => name).sort((a, b) => a.localeCompare(b));
  const actualVendors = (activeVendors || []).map(({ name }) => name).sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(actualBrands) !== JSON.stringify(expected) || JSON.stringify(actualVendors) !== JSON.stringify(expected)) {
    throw new Error('Post-apply brand/vendor verification failed.');
  }
  console.log(JSON.stringify({ ...before, verifiedActiveBrands: actualBrands, verifiedActiveSuppliers: actualVendors }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
