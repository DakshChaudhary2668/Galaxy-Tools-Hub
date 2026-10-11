import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { findManifestMatches } from './sync-fluke-quality';

type ManifestProduct = {
  brand: string;
  model: string;
  displayName: string;
  sku: string;
  slug: string;
  importStatus: string;
  officialImageSource: string | null;
  weightSource: string | null;
};
type Product = { id: string; name: string; sku: string; slug: string; source_model_no: string | null; brand_id: string; weight_grams: number | null; specifications: Record<string, unknown> | null; is_purchasable: boolean };
type ProductImage = { id: string; product_id: string; storage_path: string; public_url: string; is_primary: boolean; sort_order: number };
type Asset = { url: string; body: Buffer; contentType: string; extension: string; hash: string };

const normalize = (value: string) => value.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '');
const isExactPage = (item: ManifestProduct, url: string) => {
  try {
    const leaf = new URL(url).pathname.split('/').filter(Boolean).at(-1) || '';
    return [item.model, `fluke-${item.model}`].map(normalize).includes(normalize(leaf));
  } catch {
    return false;
  }
};
const pageFor = (item: ManifestProduct) => {
  const candidates = [item.officialImageSource, item.weightSource].filter((value): value is string => Boolean(value));
  return candidates.find((url) => url.includes('fluke.com/') && !url.toLowerCase().endsWith('.pdf') && isExactPage(item, url)) || null;
};

async function officialAssets(page: string): Promise<Asset[]> {
  const response = await fetch(page);
  if (!response.ok) throw new Error(`page HTTP ${response.status}`);
  const html = await response.text();
  const urls = [...new Set(html.match(/https:\/\/media\.fluke\.com\/[^"'<> ]+_original__size\.(?:jpg|jpeg|png|webp)/gi) || [])].slice(0, 6);
  if (urls.length < 2) throw new Error(`official gallery has ${urls.length} usable images`);
  return Promise.all(urls.map(async (url) => {
    const assetResponse = await fetch(url);
    if (!assetResponse.ok) throw new Error(`asset HTTP ${assetResponse.status}`);
    const contentType = (assetResponse.headers.get('content-type') || '').split(';')[0].toLowerCase();
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : contentType === 'image/jpeg' || contentType === 'image/jpg' ? 'jpg' : '';
    if (!extension) throw new Error(`unsupported asset type ${contentType}`);
    const body = Buffer.from(await assetResponse.arrayBuffer());
    if (!body.length || body.length > 10 * 1024 * 1024) throw new Error(`invalid asset size ${body.length}`);
    return { url, body, contentType, extension, hash: crypto.createHash('sha256').update(body).digest('hex') };
  }));
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
  const [{ data: brands, error: brandError }, { data: rows, error: productError }, { data: imageRows, error: imageError }] = await Promise.all([
    db.from('brands').select('id,name'),
    db.from('products').select('id,name,sku,slug,source_model_no,brand_id,weight_grams,specifications,is_purchasable'),
    db.from('product_images').select('id,product_id,storage_path,public_url,is_primary,sort_order')
  ]);
  if (brandError) throw brandError;
  if (productError) throw productError;
  if (imageError) throw imageError;
  const flukeBrands = (brands || []).filter((brand) => normalize(brand.name) === 'fluke');
  if (flukeBrands.length !== 1) throw new Error(`Expected one Fluke brand, found ${flukeBrands.length}.`);
  const products = ((rows || []) as Product[]).filter((product) => product.brand_id === flukeBrands[0].id);
  const allImages = (imageRows || []) as ProductImage[];
  const review: Array<{ model: string; reason: string }> = [];
  const prepared: Array<{ item: ManifestProduct; product: Product; page: string; assets: Asset[]; current: ProductImage[] }> = [];

  for (const item of catalogue) {
    const matches = findManifestMatches(products, item as never);
    if (matches.length !== 1) {
      review.push({ model: item.model, reason: `live matches: ${matches.length}` });
      continue;
    }
    const page = pageFor(item);
    if (!page) {
      review.push({ model: item.model, reason: 'SECOND_IMAGE_REVIEW_REQUIRED' });
      continue;
    }
    const current = allImages.filter((image) => image.product_id === matches[0].id);
    if (current.length === 2 && current.every((image) => /\/official-[12]\./.test(image.storage_path)) && current.filter((image) => image.is_primary).length === 1) continue;
    try {
      const assets = await officialAssets(page);
      if (assets[0].hash === assets[1].hash) throw new Error('duplicate gallery assets');
      prepared.push({ item, product: matches[0], page, assets, current });
    } catch (error) {
      review.push({ model: item.model, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  const hashOwners = new Map<string, string[]>();
  for (const plan of prepared) for (const asset of plan.assets) hashOwners.set(asset.hash, [...(hashOwners.get(asset.hash) || []), plan.item.model]);
  const crossModelHashes = new Set([...hashOwners.entries()].filter(([, models]) => new Set(models).size > 1).map(([hash]) => hash));
  const uniquePlans = prepared.map((plan) => ({ ...plan, assets: plan.assets.filter((asset) => !crossModelHashes.has(asset.hash)).slice(0, 2) }));
  const safe = uniquePlans.filter((plan) => plan.assets.length === 2);
  for (const plan of uniquePlans.filter((plan) => plan.assets.length < 2)) review.push({ model: plan.item.model, reason: 'fewer than two model-unique official assets' });
  const summary = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    liveFlukeRows: products.length,
    exactOfficialPages: prepared.length,
    productsReady: safe.map(({ item, page, assets }) => ({ model: item.model, page, images: assets.map(({ url: assetUrl }) => assetUrl) })),
    secondImageReviewRequired: review,
    productsApplied: 0,
    imagesUploaded: 0,
    imagesRemoved: 0
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  for (const plan of safe) {
    const addedRows: string[] = [];
    const addedPaths: string[] = [];
    try {
      for (let index = 0; index < plan.assets.length; index += 1) {
        const asset = plan.assets[index];
        const storagePath = `products/${plan.product.id}/official-${index + 1}.${asset.extension}`;
        const { error: uploadError } = await db.storage.from('product-images').upload(storagePath, asset.body, { contentType: asset.contentType, upsert: true });
        if (uploadError) throw uploadError;
        addedPaths.push(storagePath);
        const { data: publicData } = db.storage.from('product-images').getPublicUrl(storagePath);
        const { data: image, error: insertError } = await db.from('product_images').insert({
          product_id: plan.product.id,
          storage_path: storagePath,
          public_url: publicData.publicUrl,
          alt_text: `${plan.item.displayName}${index ? ' alternate view' : ''}`,
          is_primary: false,
          sort_order: index
        }).select('id').single();
        if (insertError || !image) throw insertError || new Error('image metadata insert failed');
        addedRows.push(image.id);
      }
      const { error: clearPrimaryError } = await db.from('product_images').update({ is_primary: false }).eq('product_id', plan.product.id);
      if (clearPrimaryError) throw clearPrimaryError;
      const { error: primaryError } = await db.from('product_images').update({ is_primary: true }).eq('id', addedRows[0]);
      if (primaryError) throw primaryError;
      if (plan.current.length) {
        const { error: deleteError } = await db.from('product_images').delete().in('id', plan.current.map(({ id }) => id));
        if (deleteError) throw deleteError;
        const safeOldPaths = plan.current.filter(({ storage_path }) => storage_path && !allImages.some((image) => image.product_id !== plan.product.id && image.storage_path === storage_path)).map(({ storage_path }) => storage_path);
        if (safeOldPaths.length) await db.storage.from('product-images').remove(safeOldPaths);
        summary.imagesRemoved += plan.current.length;
      }
      summary.productsApplied += 1;
      summary.imagesUploaded += 2;
    } catch (error) {
      if (addedRows.length) await db.from('product_images').delete().in('id', addedRows);
      if (addedPaths.length) await db.storage.from('product-images').remove(addedPaths);
      const previousPrimary = plan.current.find(({ is_primary }) => is_primary);
      if (previousPrimary) await db.from('product_images').update({ is_primary: true }).eq('id', previousPrimary.id);
      throw new Error(`${plan.item.model}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
