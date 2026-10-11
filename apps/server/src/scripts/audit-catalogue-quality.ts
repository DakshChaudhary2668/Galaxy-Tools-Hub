import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const normalize = (value: string | null | undefined) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

  const db = createClient(url, key, { auth: { persistSession: false } });
  const [brandsResult, vendorsResult, productsResult, imagesResult, inventoryResult] = await Promise.all([
    db.from('brands').select('id,name,slug,logo_url,is_active').order('name'),
    db.from('vendors').select('id,name,code,is_active').order('name'),
    db.from('products').select('id,name,sku,source_model_no,brand_id,source_vendor_id,weight_grams,is_active,is_purchasable').order('name'),
    db.from('product_images').select('id,product_id,storage_path,public_url,is_primary,sort_order').order('sort_order'),
    db.from('inventory').select('product_id,quantity,reserved_quantity')
  ]);
  for (const result of [brandsResult, vendorsResult, productsResult, imagesResult, inventoryResult]) {
    if (result.error) throw result.error;
  }

  const brands = brandsResult.data || [];
  const vendors = vendorsResult.data || [];
  const products = productsResult.data || [];
  const images = imagesResult.data || [];
  const inventory = new Map((inventoryResult.data || []).map((row) => [row.product_id, row]));
  const flukeBrandIds = new Set(brands.filter((brand) => normalize(brand.name) === 'fluke').map((brand) => brand.id));
  const flukeProducts = products.filter((product) => flukeBrandIds.has(product.brand_id));
  const imageGroups = new Map<string, string[]>();
  for (const image of images) {
    const key = image.storage_path || image.public_url;
    imageGroups.set(key, [...(imageGroups.get(key) || []), image.product_id]);
  }

  console.log(JSON.stringify({
    mode: 'READ_ONLY',
    brands,
    vendors,
    brandProductCounts: Object.fromEntries(brands.map((brand) => [brand.name, products.filter((product) => product.brand_id === brand.id).length])),
    vendorProductCounts: Object.fromEntries(vendors.map((vendor) => [vendor.name, products.filter((product) => product.source_vendor_id === vendor.id).length])),
    fluke: {
      total: flukeProducts.length,
      missingWeight: flukeProducts.filter((product) => !product.weight_grams).length,
      missingImage: flukeProducts.filter((product) => !images.some((image) => image.product_id === product.id)).length,
      fewerThanTwoImages: flukeProducts.filter((product) => images.filter((image) => image.product_id === product.id).length < 2).length,
      sharedImageGroups: [...imageGroups.entries()].filter(([, productIds]) => new Set(productIds).size > 1).map(([image, productIds]) => ({ image, productIds: [...new Set(productIds)] })),
      products: flukeProducts.map((product) => {
        const productImages = images.filter((image) => image.product_id === product.id);
        return {
          ...product,
          inventory: inventory.get(product.id) || null,
          current_image_count: productImages.length,
          current_primary_image: productImages.find((image) => image.is_primary)?.public_url || null,
          images: productImages
        };
      })
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
