import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

type ManifestProduct = {
  brand: string;
  model: string;
  displayName: string;
  websiteBasePrice: number | null;
  taxRate: number | null;
  weightGrams: number | null;
  hsnCode: string | null;
  importStatus: string;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

async function main() {
  const apply = process.argv.includes('--apply');
  const root = path.resolve(process.cwd(), '../..');
  const manifestPath = path.join(root, 'scripts/data/fluke-retail-price-list-2026-07-04.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { products: ManifestProduct[] };
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

  const db = createClient(url, key, { auth: { persistSession: false } });
  const summary = { mode: apply ? 'APPLY' : 'DRY_RUN', total: manifest.products.length, ready: 0, updated: 0, unchanged: 0, skipped: 0, conflicts: [] as string[] };
  const { data: brands, error: brandError } = await db.from('brands').select('id,name');
  if (brandError) throw brandError;
  const flukeBrand = brands?.find((brand) => normalize(brand.name) === 'fluke');
  if (!flukeBrand) throw new Error('Existing Fluke brand was not found; importer will not create a duplicate.');

  const { data: products, error: productError } = await db
    .from('products')
    .select('id,name,sku,slug,source_model_no,price,hsn_code,tax_rate,weight_grams,brand_id')
    .eq('brand_id', flukeBrand.id);
  if (productError) {
    if (/weight_grams/i.test(productError.message)) throw new Error('Apply the weight_grams migration before running the catalogue importer.');
    throw productError;
  }

  for (const item of manifest.products) {
    if (item.importStatus !== 'READY_FOR_EXISTING_MATCH') {
      summary.skipped += 1;
      continue;
    }
    summary.ready += 1;
    const needle = normalize(`Fluke ${item.model}`);
    const matches = (products || []).filter((product) => {
      const fields = [product.name, product.source_model_no, product.sku, product.slug].filter(Boolean).map(normalize);
      return fields.some((field) => field === normalize(item.model) || field === needle || field.startsWith(needle));
    });
    if (matches.length !== 1) {
      summary.conflicts.push(`${item.displayName}: expected one existing match, found ${matches.length}`);
      continue;
    }
    const product = matches[0];
    if (!product.hsn_code || !item.websiteBasePrice || !item.weightGrams || item.taxRate !== 18) {
      summary.conflicts.push(`${item.displayName}: unresolved HSN, price, weight, or tax`);
      continue;
    }
    const patch = { price: item.websiteBasePrice, tax_rate: 18, weight_grams: item.weightGrams };
    const changed = Number(product.price) !== patch.price || Number(product.tax_rate) !== 18 || Number(product.weight_grams) !== patch.weight_grams;
    if (!changed) {
      summary.unchanged += 1;
      continue;
    }
    if (apply) {
      const { error } = await db.from('products').update(patch).eq('id', product.id);
      if (error) throw new Error(`${item.displayName}: ${error.message}`);
    }
    summary.updated += 1;
  }

  console.log(JSON.stringify(summary, null, 2));
  if (summary.conflicts.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
