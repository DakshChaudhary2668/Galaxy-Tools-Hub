import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

type ManifestProduct = {
  brand: string;
  model: string;
  displayName: string;
  cataloguePrice: number;
  websiteBasePrice: number | null;
  taxRate: number | null;
  warranty: string;
  specifications: Record<string, string>;
  weightGrams: number | null;
  weightType: 'NET_PRODUCT' | 'SELLABLE_KIT' | 'PACKAGE_ONLY' | 'UNRESOLVED';
  weightSource: string | null;
  weightSourceTitle: string | null;
  weightConfidence: string;
  category: string;
  sku: string;
  slug: string;
  hsnCode: string | null;
  hsnBasis: string;
  hsnSource: string | null;
  hsnConfidence: string;
  description: string;
  officialImageUrl: string | null;
  officialImageSource: string | null;
  imageStatus: string;
  importStatus: string;
};

type DbProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  source_model_no: string | null;
  price: number | string | null;
  hsn_code: string;
  tax_rate: number | string;
  weight_grams: number | null;
  brand_id: string;
  source_vendor_id: string;
  category_id: string;
  is_active: boolean;
  is_purchasable: boolean;
};

const normalize = (value: string | null | undefined) => (value || '').toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '');
const count = <T>(items: T[], predicate: (item: T) => boolean) => items.filter(predicate).length;
const sameMoney = (left: number | string | null, right: number) => Math.round(Number(left) * 100) === Math.round(right * 100);

async function main() {
  const apply = process.argv.includes('--apply');
  const root = path.resolve(process.cwd(), '../..');
  const manifestPath = path.join(root, 'scripts/data/fluke-retail-price-list-2026-07-04.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { products: ManifestProduct[] };
  const fluke = manifest.products.filter((item) => item.brand === 'Fluke');
  const raytek = manifest.products.filter((item) => item.brand !== 'Fluke');
  const existingItems = fluke.filter((item) => item.importStatus === 'READY_FOR_EXISTING_MATCH');
  const newItems = fluke.filter((item) => item.importStatus !== 'READY_FOR_EXISTING_MATCH');
  if (manifest.products.length !== 76 || fluke.length !== 75 || raytek.length !== 1 || raytek[0].model !== 'Raytek MT4' || existingItems.length !== 6 || newItems.length !== 69) {
    throw new Error('Catalogue count changed; expected 76 total, 75 Fluke, 1 Raytek, 6 existing, and 69 new rows.');
  }

  const priceMismatches = count(fluke, (item) => item.websiteBasePrice !== Number((item.cataloguePrice * 0.75).toFixed(2)));
  const taxMismatches = count(fluke, (item) => item.taxRate !== 18);
  const duplicateSkus = fluke.length - new Set(fluke.map((item) => item.sku)).size;
  const duplicateSlugs = fluke.length - new Set(fluke.map((item) => item.slug)).size;
  if (priceMismatches || taxMismatches || duplicateSkus || duplicateSlugs) {
    throw new Error(`Manifest safety gate failed: price=${priceMismatches}, tax=${taxMismatches}, sku=${duplicateSkus}, slug=${duplicateSlugs}`);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: brands, error: brandError }, { data: vendors, error: vendorError }, { data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
    db.from('brands').select('id,name'),
    db.from('vendors').select('id,name,code,is_active'),
    db.from('categories').select('id,name'),
    db.from('products').select('id,name,sku,slug,source_model_no,price,hsn_code,tax_rate,weight_grams,brand_id,source_vendor_id,category_id,is_active,is_purchasable')
  ]);
  if (brandError) throw brandError;
  if (vendorError) throw vendorError;
  if (categoryError) throw categoryError;
  if (productError) throw productError;

  const brandMatches = (brands || []).filter((brand) => normalize(brand.name) === 'fluke');
  if (brandMatches.length !== 1) throw new Error(`Expected one canonical Fluke brand, found ${brandMatches.length}.`);
  const flukeBrand = brandMatches[0];
  const vendorMatches = (vendors || []).filter((vendor) => normalize(vendor.name) === 'fluke');
  const vendorCodeConflict = (vendors || []).some((vendor) => normalize(vendor.code) === 'fluke' && normalize(vendor.name) !== 'fluke');
  if (vendorMatches.length > 1 || vendorCodeConflict) throw new Error('Canonical Fluke vendor cannot be resolved uniquely.');
  const categoryByName = new Map((categories || []).map((category) => [normalize(category.name), category]));
  const missingCategories = [...new Set(fluke.map((item) => item.category))].filter((name) => !categoryByName.has(normalize(name)));
  if (missingCategories.length) throw new Error(`Missing categories: ${missingCategories.join(', ')}`);

  const dbProducts = (products || []) as DbProduct[];
  const matchesFor = (item: ManifestProduct) => dbProducts.filter((product) => {
    if (product.brand_id !== flukeBrand.id) return false;
    const exactFields = [product.sku, product.source_model_no].map(normalize);
    return exactFields.includes(normalize(item.model))
      || exactFields.includes(normalize(`Fluke ${item.model}`))
      || exactFields.includes(normalize(item.sku))
      || product.slug === item.slug
      || normalize(product.name) === normalize(item.displayName)
      || normalize(product.name) === normalize(`Fluke ${item.model}`);
  });

  const conflicts: string[] = [];
  const existingMatches = existingItems.map((item) => ({ item, matches: matchesFor(item) }));
  for (const { item, matches } of existingMatches) {
    if (matches.length !== 1) conflicts.push(`${item.displayName}: expected one existing match, found ${matches.length}`);
  }

  const newPlans = newItems.map((item) => ({ item, matches: matchesFor(item) }));
  for (const { item, matches } of newPlans) {
    if (matches.length > 1) conflicts.push(`${item.displayName}: ambiguous existing matches (${matches.length})`);
    if (matches.length === 1) {
      const product = matches[0];
      const category = categoryByName.get(normalize(item.category))!;
      const unchanged = product.name === item.displayName
        && product.sku === item.sku
        && product.slug === item.slug
        && product.source_model_no === item.model
        && sameMoney(product.price, item.websiteBasePrice || 0)
        && Number(product.tax_rate) === 18
        && product.hsn_code === item.hsnCode
        && Number(product.weight_grams || 0) === Number(item.weightGrams || 0)
        && product.category_id === category.id
        && product.source_vendor_id === vendorMatches[0]?.id
        && product.is_active
        && !product.is_purchasable;
      if (!unchanged) conflicts.push(`${item.displayName}: existing row differs from the controlled catalogue payload`);
    }
  }

  for (const item of newItems) {
    const skuOwner = dbProducts.find((product) => product.sku === item.sku);
    const slugOwner = dbProducts.find((product) => product.slug === item.slug);
    const matches = matchesFor(item);
    if (skuOwner && !matches.some((product) => product.id === skuOwner.id)) conflicts.push(`${item.displayName}: SKU collision ${item.sku}`);
    if (slugOwner && !matches.some((product) => product.id === slugOwner.id)) conflicts.push(`${item.displayName}: slug collision ${item.slug}`);
  }

  const creatable = newPlans.filter(({ item, matches }) => matches.length === 0 && Boolean(item.hsnCode) && ['SAFE_TO_CREATE', 'SAFE_CATALOG_ONLY'].includes(item.importStatus));
  const importedUnchanged = count(newPlans, ({ item, matches }) => matches.length === 1 && Boolean(item.hsnCode));
  const existingCommercialDrift = count(existingMatches, ({ item, matches }) => matches.length === 1 && (
    !sameMoney(matches[0].price, item.websiteBasePrice || 0)
    || Number(matches[0].tax_rate) !== 18
    || Number(matches[0].weight_grams) !== Number(item.weightGrams)
  ));
  const existingSupplierChanges = count(existingMatches, ({ matches }) => matches.length === 1 && (!vendorMatches[0] || matches[0].source_vendor_id !== vendorMatches[0].id));

  const summary = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    manifest: { total: manifest.products.length, fluke: fluke.length, raytek: raytek.length, startingNewFlukeRows: newItems.length },
    vendor: { action: vendorMatches[0] ? 'REUSE' : 'CREATE', id: vendorMatches[0]?.id || null, existingSupplierChanges },
    weights: {
      NET_PRODUCT: count(newItems, (item) => item.weightType === 'NET_PRODUCT'),
      SELLABLE_KIT: count(newItems, (item) => item.weightType === 'SELLABLE_KIT'),
      PACKAGE_ONLY: count(newItems, (item) => item.weightType === 'PACKAGE_ONLY'),
      UNRESOLVED: count(newItems, (item) => item.weightType === 'UNRESOLVED')
    },
    hsn: { resolved: count(newItems, (item) => Boolean(item.hsnCode)), unresolved: count(newItems, (item) => !item.hsnCode) },
    images: { official: count(newItems, (item) => item.imageStatus === 'OFFICIAL'), pdfFallback: 0, missing: count(newItems, (item) => item.imageStatus === 'REVIEW_REQUIRED'), uploaded: 0, failed: [] as string[] },
    products: {
      SAFE_TO_CREATE: count(newItems, (item) => item.importStatus === 'SAFE_TO_CREATE'),
      SAFE_CATALOG_ONLY: count(newItems, (item) => item.importStatus === 'SAFE_CATALOG_ONLY'),
      HSN_BLOCKED: count(newItems, (item) => item.importStatus === 'HSN_REVIEW_REQUIRED'),
      OTHER_BLOCKED: count(newItems, (item) => !['SAFE_TO_CREATE', 'SAFE_CATALOG_ONLY', 'HSN_REVIEW_REQUIRED'].includes(item.importStatus)),
      toInsert: creatable.length,
      inserted: 0,
      importedUnchanged,
      existingCommercialDrift,
      existingSupplierUpdated: 0
    },
    checks: { duplicateSkus, duplicateSlugs, priceMismatches, taxMismatches, conflicts }
  };

  if (conflicts.length || existingCommercialDrift) {
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 2;
    return;
  }
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  let vendor = vendorMatches[0];
  let vendorCreated = false;
  if (!vendor) {
    const { data, error } = await db.from('vendors').insert({ name: 'Fluke', code: 'FLUKE', description: 'Fluke catalogue supplier', is_active: true }).select('id,name,code,is_active').single();
    if (error || !data) throw error || new Error('Failed to create canonical Fluke vendor.');
    vendor = data;
    vendorCreated = true;
    summary.vendor.id = vendor.id;
  }

  const payload = creatable.map(({ item }) => {
    const category = categoryByName.get(normalize(item.category))!;
    return {
      category_id: category.id,
      brand_id: flukeBrand.id,
      source_vendor_id: vendor!.id,
      sku: item.sku,
      source_model_no: item.model,
      name: item.displayName,
      slug: item.slug,
      product_type: 'PRODUCT',
      short_description: `${item.displayName} from Fluke's ${item.category} range.`,
      description: item.description,
      specifications: { ...item.specifications, warranty: item.warranty, weightType: item.weightType, weightSource: item.weightSource, weightConfidence: item.weightConfidence, hsnBasis: item.hsnBasis, hsnSource: item.hsnSource, hsnConfidence: item.hsnConfidence },
      pricing_type: 'FIXED',
      price: item.websiteBasePrice,
      compare_at_price: null,
      hsn_code: item.hsnCode,
      tax_rate: 18,
      minimum_order_quantity: 1,
      weight_grams: item.weightGrams,
      seo_title: item.displayName,
      seo_description: item.description,
      meta_keywords: `Fluke, ${item.model}, ${item.category}`,
      is_purchasable: false,
      is_featured: false,
      is_active: true,
      show_on_homepage: false
    };
  });

  let inserted: { id: string; sku: string }[] = [];
  try {
    if (payload.length) {
      const { data, error } = await db.from('products').insert(payload).select('id,sku');
      if (error || !data || data.length !== payload.length) throw error || new Error('Product insert count mismatch.');
      inserted = data;
      const { error: inventoryError } = await db.from('inventory').insert(inserted.map((product) => ({ product_id: product.id, quantity: 0, reserved_quantity: 0, reorder_level: 5 })));
      if (inventoryError) throw inventoryError;
    }

    const existingIds = existingMatches.map(({ matches }) => matches[0].id);
    if (existingSupplierChanges) {
      const { error } = await db.from('products').update({ source_vendor_id: vendor.id }).in('id', existingIds);
      if (error) throw error;
      summary.products.existingSupplierUpdated = existingSupplierChanges;
    }
  } catch (error) {
    if (inserted.length) await db.from('products').delete().in('id', inserted.map((product) => product.id));
    if (vendorCreated) await db.from('vendors').delete().eq('id', vendor.id);
    throw error;
  }

  const insertedBySku = new Map(inserted.map((product) => [product.sku, product]));
  for (const { item } of creatable) {
    const product = insertedBySku.get(item.sku);
    if (!product || !item.officialImageUrl) continue;
    let storagePath: string | null = null;
    try {
      const response = await fetch(item.officialImageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get('content-type') || '').split(';')[0];
      const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : contentType === 'image/jpeg' || contentType === 'image/jpg' ? 'jpg' : null;
      if (!extension) throw new Error(`unsupported content type ${contentType}`);
      const body = Buffer.from(await response.arrayBuffer());
      if (!body.length || body.length > 10 * 1024 * 1024) throw new Error('image size is invalid');
      storagePath = `products/${product.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage.from('product-images').upload(storagePath, body, { contentType, upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = db.storage.from('product-images').getPublicUrl(storagePath);
      const { error: imageError } = await db.from('product_images').insert({ product_id: product.id, storage_path: storagePath, public_url: publicData.publicUrl, alt_text: item.displayName, is_primary: true, sort_order: 0 });
      if (imageError) throw imageError;
      summary.images.uploaded += 1;
    } catch (error) {
      if (storagePath) await db.storage.from('product-images').remove([storagePath]);
      summary.images.failed.push(`${item.model}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  summary.products.inserted = inserted.length;
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
