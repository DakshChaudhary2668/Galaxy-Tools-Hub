import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

type ManifestProduct = {
  brand: string;
  model: string;
  displayName: string;
  sku: string;
  slug: string;
  importStatus: string;
  weightGrams: number | null;
  weightType: string;
  weightSource: string | null;
  weightSourceTitle: string | null;
  weightConfidence: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  source_model_no: string | null;
  brand_id: string;
  weight_grams: number | null;
  specifications: Record<string, unknown> | null;
  is_purchasable: boolean;
};

const normalize = (value: string | null | undefined) => (value || '').toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '');

export function findManifestMatches(products: Product[], item: ManifestProduct) {
  const strong = products.filter((product) => [product.sku, product.source_model_no].map(normalize).some((value) =>
    value === normalize(item.model) || value === normalize(`Fluke ${item.model}`) || value === normalize(item.sku)
  ));
  if (strong.length) return strong;
  return products.filter((product) => product.slug === item.slug || normalize(product.name) === normalize(item.displayName));
}

async function main() {
  const apply = process.argv.includes('--apply');
  const root = path.resolve(process.cwd(), '../..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/fluke-retail-price-list-2026-07-04.json'), 'utf8')) as { products: ManifestProduct[] };
  const catalogue = manifest.products.filter((item) => item.brand === 'Fluke' && item.importStatus !== 'HSN_REVIEW_REQUIRED');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: brands, error: brandError }, { data: rows, error: productError }] = await Promise.all([
    db.from('brands').select('id,name'),
    db.from('products').select('id,name,sku,slug,source_model_no,brand_id,weight_grams,specifications,is_purchasable')
  ]);
  if (brandError) throw brandError;
  if (productError) throw productError;
  const flukeBrands = (brands || []).filter((brand) => normalize(brand.name) === 'fluke');
  if (flukeBrands.length !== 1) throw new Error(`Expected one Fluke brand, found ${flukeBrands.length}.`);
  const products = ((rows || []) as Product[]).filter((product) => product.brand_id === flukeBrands[0].id);
  const conflicts: string[] = [];
  const unmatched = catalogue.filter((item) => findManifestMatches(products, item).length === 0).map((item) => item.model);
  const plans = catalogue.flatMap((item) => {
    const matches = findManifestMatches(products, item);
    if (matches.length > 1) conflicts.push(`${item.model}: ${matches.length} live matches`);
    if (matches.length !== 1) return [];
    const product = matches[0];
    const specifications = product.specifications || {};
    const metadataChanged = item.weightGrams !== null && (
      specifications.weightType !== item.weightType
      || specifications.weightSource !== item.weightSource
      || specifications.weightSourceTitle !== item.weightSourceTitle
      || specifications.weightConfidence !== item.weightConfidence
    );
    const weightChanged = item.weightGrams !== null && product.weight_grams !== item.weightGrams;
    const blockUnresolved = item.weightGrams === null && product.is_purchasable;
    return [{ item, product, specifications, metadataChanged, weightChanged, blockUnresolved }];
  });
  if (conflicts.length) throw new Error(`Ambiguous product matches: ${conflicts.join('; ')}`);

  const changes = plans.filter((plan) => plan.metadataChanged || plan.weightChanged || plan.blockUnresolved);
  const summary = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    liveFlukeRows: products.length,
    catalogueMatches: plans.length,
    unmatched,
    weightUpdates: changes.filter(({ weightChanged }) => weightChanged).map(({ item, product }) => ({ id: product.id, model: item.model, from: product.weight_grams, to: item.weightGrams })),
    metadataUpdates: changes.filter(({ metadataChanged }) => metadataChanged).map(({ item }) => item.model),
    unresolved: plans.filter(({ item }) => item.weightGrams === null).map(({ item }) => item.model),
    purchasingBlocks: changes.filter(({ blockUnresolved }) => blockUnresolved).map(({ item }) => item.model)
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const completed: typeof changes = [];
  try {
    for (const plan of changes) {
      const payload: Record<string, unknown> = {};
      if (plan.item.weightGrams !== null) {
        payload.weight_grams = plan.item.weightGrams;
        payload.specifications = {
          ...plan.specifications,
          weightType: plan.item.weightType,
          weightSource: plan.item.weightSource,
          weightSourceTitle: plan.item.weightSourceTitle,
          weightConfidence: plan.item.weightConfidence
        };
      }
      if (plan.blockUnresolved) payload.is_purchasable = false;
      const { error } = await db.from('products').update(payload).eq('id', plan.product.id);
      if (error) throw error;
      completed.push(plan);
    }
  } catch (error) {
    for (const plan of completed.reverse()) {
      await db.from('products').update({
        weight_grams: plan.product.weight_grams,
        specifications: plan.product.specifications,
        is_purchasable: plan.product.is_purchasable
      }).eq('id', plan.product.id);
    }
    throw error;
  }

  const { data: verified, error: verifyError } = await db.from('products').select('id,weight_grams,is_purchasable').in('id', changes.map(({ product }) => product.id));
  if (verifyError) throw verifyError;
  for (const plan of changes) {
    const row = verified?.find(({ id }) => id === plan.product.id);
    if (!row || (plan.item.weightGrams !== null && row.weight_grams !== plan.item.weightGrams) || (plan.item.weightGrams === null && row.is_purchasable)) {
      throw new Error(`Post-apply verification failed for ${plan.item.model}.`);
    }
  }
  console.log(JSON.stringify({ ...summary, verified: changes.length }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
