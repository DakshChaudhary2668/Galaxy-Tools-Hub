'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { createProduct } from '../../../../services/product.service';
import { useCategories } from '../../../../hooks/useCategories';
import { useBrands } from '../../../../hooks/useBrands';
import styles from '../Products.module.scss';

interface SpecPair {
  key: string;
  value: string;
}

export default function AdminNewProductPage() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState<string>('');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [hsnCode, setHsnCode] = useState('9030');
  const [taxRate, setTaxRate] = useState('18');
  const [stock, setStock] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [imageUrl, setImageUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [specs, setSpecs] = useState<SpecPair[]>([
    { key: 'Brand Warranty', value: '1 Year Manufacturer Warranty' },
    { key: 'Accuracy', value: '±0.5% + 2 digits' },
    { key: 'Display', value: '4000 Counts Backlit LCD' }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto slug generation on name change
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('Product SKU is required.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('A valid selling price greater than 0 is required.');
      return;
    }

    setSaving(true);

    try {
      // Build structured specifications record
      const specRecord: Record<string, string> = {};
      specs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specRecord[s.key.trim()] = s.value.trim();
        }
      });

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        slug: (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        source_model_no: sku.trim(),
        category_id: categoryId || (categories[0]?.id as string),
        brand_id: brandId || (brands[0]?.id as string),
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        hsn_code: hsnCode.trim() || '9030',
        tax_rate: Number(taxRate) || 18,
        stock: Number(stock) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        image_url: imageUrl.trim() || undefined,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        specifications: specRecord,
        seo_title: seoTitle.trim() || name.trim(),
        seo_description: seoDescription.trim() || shortDescription.trim() || null,
        is_active: isActive,
        is_featured: isFeatured
      };

      await createProduct(payload);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className={styles.productsContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/products" className={styles.resetBtn}>
            <ArrowLeft size={15} />
            <span>Back</span>
          </Link>
          <div className={styles.titleBlock}>
            <h1>Add New Instrument</h1>
            <p>Create a product record with technical specifications and pricing.</p>
          </div>
        </div>

        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Creating Product...' : 'Save Product'}</span>
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>Product created successfully! Redirecting to catalog...</span>
        </div>
      )}

      <div className={styles.formGrid}>
        {/* Main Column */}
        <div>
          {/* Section 1: Basic Information */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Basic Information</h2>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="productName">Product Name *</label>
              <input
                id="productName"
                type="text"
                placeholder="e.g. HTC DM-98 Digital Multimeter with True RMS"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label htmlFor="productSku">Product SKU *</label>
                <input
                  id="productSku"
                  type="text"
                  placeholder="e.g. HTC-DM98-TRMS"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="productSlug">URL Slug</label>
                <input
                  id="productSlug"
                  type="text"
                  placeholder="e.g. htc-dm-98-digital-multimeter"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label htmlFor="productCategory">Category</label>
                <select
                  id="productCategory"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="productBrand">Brand</label>
                <select
                  id="productBrand"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">Select Brand...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Tax */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Pricing & Taxes</h2>
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label htmlFor="price">Selling Price (₹) *</label>
                <input
                  id="price"
                  type="number"
                  placeholder="e.g. 4250"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="comparePrice">Compare-at Price (₹)</label>
                <input
                  id="comparePrice"
                  type="number"
                  placeholder="e.g. 5200"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label htmlFor="taxRate">GST Rate (%)</label>
                <select
                  id="taxRate"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                >
                  <option value="18">18% (Standard GST)</option>
                  <option value="12">12% (Reduced)</option>
                  <option value="28">28% (Luxury/Special)</option>
                  <option value="0">0% (Exempt)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="hsnCode">HSN Code</label>
                <input
                  id="hsnCode"
                  type="text"
                  placeholder="9030"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Technical Specifications */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Technical Specifications</h2>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Structured parameters displayed on the product detail page and specification sheets.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {specs.map((s, idx) => (
                <div key={idx} className={styles.specRow}>
                  <input
                    type="text"
                    placeholder="Parameter (e.g. Voltage)"
                    value={s.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 1000V AC/DC)"
                    value={s.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.removeSpecBtn}
                    onClick={() => handleRemoveSpec(idx)}
                    title="Remove specification row"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className={styles.addSpecBtn} onClick={handleAddSpec}>
              <Plus size={14} />
              <span>Add Specification Field</span>
            </button>
          </div>

          {/* Section 4: Descriptions */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Descriptions</h2>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="shortDesc">Short Summary</label>
              <input
                id="shortDesc"
                type="text"
                placeholder="High-accuracy industrial digital multimeter with safety rating"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="fullDesc">Full Technical Description</label>
              <textarea
                id="fullDesc"
                placeholder="Provide detailed technical overview, testing features, application domains..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div>
          {/* Status & Visibility */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Status & Visibility</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active in Store Catalog</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span>Show in Featured Carousel</span>
              </label>
            </div>
          </div>

          {/* Inventory */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Inventory Control</h2>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="stockQty">Stock Quantity</label>
              <input
                id="stockQty"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lowThreshold">Low Stock Alert Level</label>
              <input
                id="lowThreshold"
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Product Image */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Product Image</h2>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="productImg">Primary Image URL</label>
              <input
                id="productImg"
                type="text"
                placeholder="https://.../product.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {imageUrl && (
              <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Product Preview"
                  style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>

          {/* SEO Metadata */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>SEO Settings</h2>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="seoTitle">Meta Title</label>
              <input
                id="seoTitle"
                type="text"
                placeholder="Meta title for Google indexing"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="seoDesc">Meta Description</label>
              <textarea
                id="seoDesc"
                placeholder="Meta description summary..."
                style={{ minHeight: '70px' }}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
