import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'scripts/data/fluke-retail-price-list-2026-07-04.json');
const previousProducts = fs.existsSync(output)
  ? new Map(JSON.parse(fs.readFileSync(output, 'utf8')).products.map((product) => [product.model, product]))
  : new Map();

const sections = [
  [2, 'Digital Multimeters', 'Testing&Measurement', '1 year', [
    ['101', 4770], ['101 Kit', 5850], ['106', 6490], ['107', 8350], ['15B+', 11300],
    ['17B+', 13700], ['115', 15600], ['175', 57400], ['177', 60800], ['15B MAX', 11400],
    ['17B MAX', 13800], ['15B MAX Kit', 13800], ['17B MAX Kit', 14800]
  ]],
  [2, 'Digital Clamp Meters', 'Testing&Measurement', '1 year', [
    ['301A', 6700], ['301A+', 7730], ['301B', 8240], ['301C', 15500], ['301D', 11400],
    ['301E', 13400], ['362', 9490], ['302+', 9690], ['303', 13200], ['305', 15700],
    ['323', 24300], ['317', 23800], ['319', 37300], ['374 FC', 37500]
  ]],
  [3, 'Infrared Thermometers', 'Measuring Instruments', '1 year', [
    ['Raytek MT4', 4200, 'Raytek'], ['59 Mini', 4400], ['59 MAX', 7210], ['59 MAX+', 8350], ['62 MAX', 11500]
  ]],
  [3, 'Mobile Thermal Cameras', 'Testing Equipment', '2 years', [
    ['TC01A', 35800], ['TC01B', 45600], ['TC01C', 45600], ['TC03A', 155000]
  ]],
  [3, 'Portable Infrared Thermal Imagers', 'Testing Equipment', '2 years', [
    ['VT06', 69700], ['VT08', 78800]
  ]],
  [3, 'Laser Distance Meters', 'Measuring Instruments', '2 years', [
    ['404E', 4080], ['406E', 5200], ['417D', 10300], ['405', 9200], ['408', 15100], ['410', 19400], ['424D', 41300]
  ]],
  [3, 'Insulation Tester', 'Testing Equipment', '1 year', [['1503', 49500]]],
  [4, 'Environmental and HVAC Range', 'Measuring Instruments', '1 year', [
    ['961A', 5150], ['961B', 10500], ['961C', 7210], ['971', 30900], ['972A', 13200], ['972B', 18700],
    ['972ES', 6510], ['925', 19600], ['930', 22300], ['931', 34000], ['941', 13400], ['945', 13900]
  ]],
  [4, 'Electrical Testers', 'Electrical Tools', '2 years', [
    ['1AC-A1-II Single Pack', 4210], ['1AC-A1-II 5 Pack', 18200], ['2AC Single Pack', 4510], ['2AC 5 Pack', 20200],
    ['LVD2', 6800], ['T+Pro', 17800], ['T+Pro + 1AC Kit', 19600], ['9062', 32100]
  ]],
  [4, 'Spares & Accessories', 'Testing Equipment', '1 year', [
    ['TL75', 3390], ['TL175', 5100], ['TPAK', 2460], ['i2500-18', 14800], ['i410', 39900], ['i1010', 58000],
    ['Fuse 315mA 1pc', 2050], ['Fuse 15B+/17B+ 1 unit', 2160], ['Fuse 179 combo 5 pack', 9230],
    ['Fuse 115/15B+/17B+/179 combo 5 pack', 10700]
  ]]
];

const verifiedWeights = {
  '101': [160, 'https://www.fluke.com/en-sg/product/electrical-testing/digital-multimeters/fluke-101'],
  '106': [200, 'https://www.fluke.com/en-us/product/electrical-testing/digital-multimeters/fluke-106'],
  '107': [200, 'https://www.fluke.com/en/product/electrical-testing/digital-multimeters/fluke-107'],
  '15B+': [455, 'https://media.fluke.com/b3348117-f004-46d2-869b-b10600686a7d_original%20file.pdf'],
  '17B+': [455, 'https://media.fluke.com/b3348117-f004-46d2-869b-b10600686a7d_original%20file.pdf'],
  '115': [550, 'https://www.fluke.com/en-gb/product/electrical-testing/digital-multimeters/fluke-115'],
  '175': [420, 'https://www.fluke.com/en-ie/product/electrical-testing/digital-multimeters/fluke-175'],
  '177': [420, 'https://www.fluke.com/en/product/electrical-testing/digital-multimeters/fluke-177'],
  '15B MAX': [455, 'https://media.fluke.com/5dbb0601-a11d-4d35-94bc-b10600665be0_original%20file.pdf'],
  '17B MAX': [455, 'https://media.fluke.com/5dbb0601-a11d-4d35-94bc-b10600665be0_original%20file.pdf'],
  '301A': [132, 'https://www.fluke.com/en-id/product/electrical-testing/clamp-meters/301a'],
  '301B': [132, 'https://www.fluke.com/en-sg/product/electrical-testing/clamp-meters/301b'],
  '301C': [132, 'https://www.fluke.com/en-id/product/electrical-testing/clamp-meters/301a'],
  '301D': [154, 'https://www.fluke.com/en-sg/product/electrical-testing/clamp-meters/fluke-301d'],
  '301E': [154, 'https://www.fluke.com/en-sg/product/electrical-testing/clamp-meters/fluke-301e'],
  '374 FC': [395, 'https://www.fluke.com/en-au/product/electrical-testing/clamp-meters/fluke-374-fc'],
  '59 Mini': [200, 'https://www.fluke.com/en-in/product/temperature-measurement/ir-thermometers/fluke-59'],
  '59 MAX': [220, 'https://www.fluke.com/en-us/product/temperature-measurement/ir-thermometers/fluke-59-max'],
  '59 MAX+': [220, 'https://www.fluke.com/en-us/product/temperature-measurement/ir-thermometers/fluke-59-max-plus'],
  '62 MAX': [255, 'https://www.fluke.com/en-my/product/temperature-measurement/ir-thermometers/fluke-62-max-plus-t-plus-pro-1ac-kit'],
  'VT06': [350, 'https://media.fluke.com/9cab8598-7856-4bce-b0b5-b10800c0d6aa_original%20file.pdf'],
  'VT08': [360, 'https://media.fluke.com/9cab8598-7856-4bce-b0b5-b10800c0d6aa_original%20file.pdf'],
  '405': [110, 'https://media.fluke.com/aa03852e-45e3-4023-b1d8-b432006ed359_original%20file.pdf'],
  '417D': [95, 'https://www.fluke.com/en-sg/product/building-infrastructure/laser-distance-meters/417d'],
  '424D': [158, 'https://media.fluke.com/23e6f746-4a9e-42b9-8964-b10800c1c5c5_original%20file.pdf'],
  '1503': [550, 'https://www.fluke.com/en-au/product/electrical-testing/insulation-testers/fluke-1503'],
  '961A': [60, 'https://www.fluke.com/en-in/product/building-infrastructure/indoor-air-quality-testing/fluke-961a-961b-961c'],
  '961B': [88, 'https://www.fluke.com/en-in/product/building-infrastructure/indoor-air-quality-testing/fluke-961a-961b-961c'],
  '961C': [78, 'https://www.fluke.com/en-in/product/building-infrastructure/indoor-air-quality-testing/fluke-961a-961b-961c'],
  '971': [190, 'https://www.fluke.com/en-us/product/building-infrastructure/indoor-air-quality-testing/fluke-971'],
  '972A': [172, 'https://www.fluke.com/en-in/product/building-infrastructure/indoor-air-quality-testing/fluke-972a-972b-972es'],
  '972ES': [127, 'https://www.fluke.com/en-in/product/building-infrastructure/indoor-air-quality-testing/fluke-972a-972b-972es'],
  '925': [363, 'https://www.fluke.com/en-in/product/building-infrastructure/indoor-air-quality-testing/fluke-925'],
  'T+Pro': [280, 'https://www.fluke.com/en-us/product/electrical-testing/basic-testers/fluke-t-plus-pro'],
  'i410': [500, 'https://assets.fluke.com/manuals/i4101010iseng0100.pdf'],
  'i1010': [500, 'https://assets.fluke.com/manuals/i4101010iseng0100.pdf']
};
const existingMatches = new Set(['101', '106', '107', '59 MAX+', '961C', 'T+Pro']);
const slugify = (value) => value.toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const cbicSource = 'https://cbic-gst.gov.in/hindi/gst-goods-services-rates.html';
const productTypeBySection = {
  'Digital Multimeters': 'Digital Multimeter',
  'Digital Clamp Meters': 'Clamp Meter',
  'Infrared Thermometers': 'Infrared Thermometer',
  'Mobile Thermal Cameras': 'Mobile Thermal Camera',
  'Portable Infrared Thermal Imagers': 'Thermal Imager',
  'Laser Distance Meters': 'Laser Distance Meter',
  'Insulation Tester': 'Insulation Tester',
  'Environmental and HVAC Range': 'Environmental Measuring Instrument',
  'Electrical Testers': 'Electrical Tester',
  'Spares & Accessories': 'Test Accessory'
};
function displayName(section, model, brand) {
  if (brand !== 'Fluke') return model;
  const suffix = productTypeBySection[section];
  return `Fluke ${model}${model.toLowerCase().includes(suffix.toLowerCase()) ? '' : ` ${suffix}`}`;
}
function resolveHsn(section, model, brand) {
  if (brand !== 'Fluke') return null;
  if (['Digital Multimeters', 'Digital Clamp Meters', 'Insulation Tester', 'Electrical Testers'].includes(section)) return '9030';
  if (section === 'Infrared Thermometers') return '9025';
  if (section === 'Laser Distance Meters') return '9015';
  if (section === 'Environmental and HVAC Range') {
    if (/^(961|971|972)/.test(model)) return '9025';
    if (model === '925') return '9026';
    if (/^(930|931)/.test(model)) return '9029';
    if (/^(941|945)/.test(model)) return '9027';
  }
  return null;
}

const products = sections.flatMap(([sourcePage, sourceSection, category, warranty, items]) => items.map(([model, cataloguePrice, itemBrand]) => {
  const brand = itemBrand || 'Fluke';
  const weight = verifiedWeights[model];
  const existing = brand === 'Fluke' && existingMatches.has(model);
  const hsnCode = resolveHsn(sourceSection, model, brand);
  const name = displayName(sourceSection, model, brand);
  const skuModel = slugify(model).toUpperCase();
  return {
    sourcePage,
    sourceSection,
    brand,
    model,
    displayName: name,
    cataloguePrice,
    hiddenReductionPercent: brand === 'Fluke' ? 25 : 0,
    websiteBasePrice: brand === 'Fluke' ? Number((cataloguePrice * 0.75).toFixed(2)) : null,
    taxRate: brand === 'Fluke' ? 18 : null,
    warranty,
    specifications: { catalogueSection: sourceSection, catalogueEffectiveDate: '2026-07-04' },
    weightGrams: weight?.[0] ?? null,
    weightType: weight ? 'NET_PRODUCT' : 'UNRESOLVED',
    weightSource: weight?.[1] ?? null,
    weightSourceTitle: weight ? `Official Fluke source for ${model}` : null,
    weightConfidence: weight ? 'OFFICIAL_MANUFACTURER' : 'UNRESOLVED',
    category,
    sku: `GTH-FLU-${skuModel}`,
    slug: slugify(name),
    hsnCode,
    hsnBasis: hsnCode ? `${sourceSection} classification under the applicable CBIC heading` : 'HSN_REVIEW_REQUIRED',
    hsnSource: hsnCode ? cbicSource : null,
    hsnConfidence: hsnCode ? 'CATEGORY_CONFIRMED' : 'UNRESOLVED',
    description: `${name} is listed in the Fluke Retail Price List effective 4 July 2026 under ${sourceSection}. Manufacturer warranty: ${warranty}.`,
    officialImageUrl: previousProducts.get(model)?.officialImageUrl ?? null,
    officialImageSource: previousProducts.get(model)?.officialImageSource ?? null,
    existingProductId: null,
    imageStatus: existing
      ? 'EXISTING_IMAGE_PRESERVED'
      : previousProducts.get(model)?.officialImageUrl
        ? 'OFFICIAL'
        : 'REVIEW_REQUIRED',
    importStatus: brand !== 'Fluke'
      ? 'NON_FLUKE_REVIEW'
      : existing
        ? 'READY_FOR_EXISTING_MATCH'
        : !hsnCode
          ? 'HSN_REVIEW_REQUIRED'
          : weight
            ? 'SAFE_TO_CREATE'
            : 'SAFE_CATALOG_ONLY'
  };
}));

if (process.argv.includes('--enrich-official-assets')) {
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const findProduct = (value) => {
    if (!value || typeof value !== 'object') return null;
    if (value['@type'] === 'Product') return value;
    for (const child of Object.values(value)) {
      const found = Array.isArray(child)
        ? child.map(findProduct).find(Boolean)
        : findProduct(child);
      if (found) return found;
    }
    return null;
  };

  for (const product of products) {
    if (product.brand !== 'Fluke' || !product.weightSource || product.weightSource.toLowerCase().endsWith('.pdf')) continue;
    const sourceSlug = normalize(new URL(product.weightSource).pathname.split('/').filter(Boolean).at(-1) || '');
    if (![normalize(product.model), normalize(`fluke-${product.model}`)].includes(sourceSlug)) continue;
    try {
      const response = await fetch(product.weightSource, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!response.ok) continue;
      const html = await response.text();
      const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
      const official = scripts.map((match) => {
        try { return findProduct(JSON.parse(match[1])); } catch { return null; }
      }).find(Boolean);
      const image = Array.isArray(official?.image) ? official.image[0] : official?.image;
      if (!official?.name || !normalize(official.name).includes(normalize(product.model)) || !/^https:\/\/media\.fluke\.com\//.test(image || '')) continue;
      product.officialImageUrl = image;
      product.officialImageSource = product.weightSource;
      product.imageStatus = product.importStatus === 'READY_FOR_EXISTING_MATCH' ? 'EXISTING_IMAGE_PRESERVED' : 'OFFICIAL';
      if (official.description) product.description = official.description;
    } catch {
      // Network enrichment is best-effort; the storefront already has a safe image fallback.
    }
  }
}

if (products.length !== 76 || products.filter((product) => product.brand === 'Fluke').length !== 75) {
  throw new Error('Catalogue line count changed; expected 76 total and 75 Fluke products.');
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify({
  source: 'Fluke Retail Price List - 4 July 2026.pdf',
  effectiveDate: '2026-07-04',
  pricingRule: 'websiteBasePrice = cataloguePrice * 0.75; GST and freight are added at checkout',
  generatedAt: '2026-10-08',
  products
}, null, 2)}\n`);
console.log(`Wrote ${products.length} catalogue lines to ${path.relative(root, output)}`);
