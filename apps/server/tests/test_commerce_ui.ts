import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ProductView } from '@galaxy/types';
import { formatBasePrice, getAvailability, getProductInformation } from '../../web/src/lib/productDisplay';

const root = fs.existsSync(path.join(process.cwd(), 'apps')) ? process.cwd() : path.resolve(process.cwd(), '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;
const test = (name: string, run: () => void) => {
  run();
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
};

const productCard = read('apps/web/src/components/ProductCard/ProductCard.tsx');
const productDetail = read('apps/web/src/app/product/[id]/ProductDetailClient.tsx');
const productGrid = read('apps/web/src/app/products/Products.module.scss');
const relatedGrid = read('apps/web/src/app/product/[id]/ProductDetail.module.scss');

test('product cards expose only commerce essentials', () => {
  assert.match(productCard, /product\.name/);
  assert.match(productCard, /formatBasePrice/);
  assert.match(productCard, /ADD TO QUOTE/);
  assert.doesNotMatch(productCard, /categoryName|technicalSpecs|footerSpecs|gstIncluded|hsn/i);
});

test('product grids target five columns at desktop', () => {
  assert.match(productGrid, /grid-template-columns:\s*repeat\(5,/);
  assert.match(relatedGrid, /\.relatedGrid[\s\S]*grid-template-columns:\s*repeat\(5,/);
});

test('base price formatting retains paise', () => {
  assert.equal(formatBasePrice(3577.5), '₹3,577.50');
  assert.equal(formatBasePrice(null), 'Price on request');
});

test('zero stock and disabled products cannot be purchased', () => {
  assert.deepEqual(getAvailability({ is_purchasable: true, inventory_quantity: 0 }), { available: false, label: 'Out of stock' });
  assert.deepEqual(getAvailability({ is_purchasable: false, inventory_quantity: 10 }), { available: false, label: 'Unavailable' });
});

test('PDP groups verified customer information and hides import provenance', () => {
  const information = getProductInformation({
    weight_grams: 160,
    specifications: {
      accuracy: '±0.5%',
      features: ['Auto range', 'Data hold'],
      packageIncludes: 'Meter; Test leads',
      warranty: '1 year',
      hsnBasis: 'Internal classification reasoning',
      weightSource: 'https://example.test/private-source',
      catalogueEffectiveDate: '2026-07-04'
    }
  } as ProductView);

  assert.deepEqual(information.technicalSpecifications, [
    { label: 'Accuracy', value: '±0.5%' },
    { label: 'Net Weight', value: '160 g' }
  ]);
  assert.deepEqual(information.features, ['Auto range', 'Data hold']);
  assert.deepEqual(information.packageIncludes, ['Meter', 'Test leads']);
  assert.equal(information.warranty, '1 year');
  assert.doesNotMatch(JSON.stringify(information), /hsnBasis|weightSource|catalogueEffectiveDate|private-source/);
});

test('sparse products do not create empty information groups', () => {
  assert.deepEqual(getProductInformation({ specifications: {} } as ProductView), {
    technicalSpecifications: [], features: [], packageIncludes: [], applications: [], warranty: null
  });
});

test('verified product weight is not repeated when specs already include weight', () => {
  const information = getProductInformation({
    weight_grams: 160,
    specifications: { 'Weight (g)': '160 gm' }
  } as ProductView);
  assert.deepEqual(information.technicalSpecifications, [{ label: 'Weight (G)', value: '160 gm' }]);
});

test('PDP states base price, GST and checkout freight without inclusive wording', () => {
  assert.match(productDetail, /Base price/);
  assert.match(productDetail, /GST/);
  assert.match(productDetail, /Freight calculated at checkout/);
  assert.doesNotMatch(productDetail, /INCL\. GST|GST included|shipping included/i);
});

assert.equal(passed, 8);
console.log(`Commerce UI focused tests: ${passed} passed`);
