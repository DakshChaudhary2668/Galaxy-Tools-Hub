import { ProductView } from '@galaxy/types';

type DisplayValue = unknown;

export interface ProductInformation {
  technicalSpecifications: Array<{ label: string; value: string }>;
  features: string[];
  packageIncludes: string[];
  applications: string[];
  warranty: string | null;
}

const INTERNAL_SPEC_KEYS = new Set([
  'catalogueSection',
  'catalogueEffectiveDate',
  'weightType',
  'weightSource',
  'weightSourceTitle',
  'weightConfidence',
  'hsnBasis',
  'hsnSource',
  'hsnConfidence',
  'source',
  'sourceUrl',
  'confidence'
].map(normalizeKey));

const FEATURE_KEYS = new Set(['feature', 'features', 'keyFeatures'].map(normalizeKey));
const PACKAGE_KEYS = new Set([
  'packageIncludes',
  'packageContents',
  'includedItems',
  'inTheBox',
  'whatsInTheBox',
  'whatIsInTheBox'
].map(normalizeKey));
const APPLICATION_KEYS = new Set(['application', 'applications', 'useCases', 'uses'].map(normalizeKey));
const WARRANTY_KEYS = new Set(['warranty', 'manufacturerWarranty'].map(normalizeKey));

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asText(value: DisplayValue): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    const values = value.map(asText).filter((item): item is string => Boolean(item));
    return values.length ? values.join(', ') : null;
  }
  return null;
}

function asList(value: DisplayValue): string[] {
  if (Array.isArray(value)) {
    return value.map(asText).filter((item): item is string => Boolean(item));
  }

  const text = asText(value);
  if (!text) return [];
  return text
    .split(/\r?\n|\s*[;•]\s*/)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export function formatBasePrice(price: number | null | undefined, currency = '₹'): string {
  if (price == null || !Number.isFinite(price)) return 'Price on request';
  return `${currency}${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)}`;
}

export function getAvailableStock(product: ProductView): number | null {
  return typeof product.inventory_quantity === 'number' ? product.inventory_quantity : null;
}

export function getAvailability(product: ProductView): {
  available: boolean;
  label: string | null;
} {
  if (product.is_purchasable === false) return { available: false, label: 'Unavailable' };
  const stock = getAvailableStock(product);
  if (stock !== null && stock <= 0) return { available: false, label: 'Out of stock' };
  return { available: true, label: null };
}

export function getProductInformation(product: ProductView): ProductInformation {
  const specifications = product.specifications && typeof product.specifications === 'object'
    ? product.specifications as Record<string, DisplayValue>
    : {};
  const technicalSpecifications: ProductInformation['technicalSpecifications'] = [];
  const features: string[] = [];
  const packageIncludes: string[] = [];
  const applications: string[] = [];
  let warranty: string | null = null;

  for (const [key, value] of Object.entries(specifications)) {
    const normalized = normalizeKey(key);
    if (INTERNAL_SPEC_KEYS.has(normalized)) continue;
    if (FEATURE_KEYS.has(normalized)) {
      features.push(...asList(value));
      continue;
    }
    if (PACKAGE_KEYS.has(normalized)) {
      packageIncludes.push(...asList(value));
      continue;
    }
    if (APPLICATION_KEYS.has(normalized)) {
      applications.push(...asList(value));
      continue;
    }
    if (WARRANTY_KEYS.has(normalized)) {
      warranty = asText(value);
      continue;
    }

    const text = asText(value);
    if (text) technicalSpecifications.push({ label: formatLabel(key), value: text });
  }

  if (product.weight_grams && !technicalSpecifications.some(({ label }) => normalizeKey(label).includes('weight'))) {
    technicalSpecifications.push({ label: 'Net Weight', value: `${product.weight_grams} g` });
  }
  if (product.dimensions && !technicalSpecifications.some(({ label }) => normalizeKey(label) === 'dimensions')) {
    technicalSpecifications.push({ label: 'Dimensions', value: product.dimensions });
  }

  return { technicalSpecifications, features, packageIncludes, applications, warranty };
}
