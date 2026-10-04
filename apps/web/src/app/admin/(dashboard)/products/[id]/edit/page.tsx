'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
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
import {
  getProductById,
  updateProduct,
  deleteProduct
} from '@/services/product.service';
import { adjustAdminInventory, getAdminInventory } from '@/services/inventory.service';
import { ImageUploadWidget } from '@/components/admin/ImageUploadWidget';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { CategoryWithProductCount } from '@/services/category.service';
import { BrandDto } from '@galaxy/types';
import styles from '../../Products.module.scss';

interface SpecPair {
  key: string;
  value: string;
}

export default function AdminEditProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: productId } = use(params);

  const { data: rawCategories = [] } = useCategories();
  const { data: rawBrands = [] } = useBrands();
  const categories: CategoryWithProductCount[] = rawCategories;
  const brands: BrandDto[] = rawBrands;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [sourceModelNo, setSourceModelNo] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [hsnCode, setHsnCode] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [stockDirty, setStockDirty] = useState(false);
  const [thresholdDirty, setThresholdDirty] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [isPurchasable, setIsPurchasable] = useState(true);

  const [specs, setSpecs] = useState<SpecPair[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchProductData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [res, inventory] = await Promise.all([getProductById(productId), getAdminInventory()]);
      if (res) {
        const p = res;
        const stockRow = inventory.find((item) => item.productId === productId);
        setInventoryId(stockRow?.id || null);
        setStock(stockRow ? String(stockRow.quantity) : '');
        setLowStockThreshold(stockRow ? String(stockRow.reorderLevel) : '5');
        setStockDirty(false);
        setThresholdDirty(false);
        setName(p.name || '');
        setSku(p.sku || '');
        setSourceModelNo(p.source_model_no || '');
        setSlug(p.slug || '');
        setCategoryId(p.category_id || '');
        setBrandId(p.brand_id || '');
        setPrice(p.price !== null && p.price !== undefined ? String(p.price) : '');
        setCompareAtPrice(p.compare_at_price ? String(p.compare_at_price) : '');
        setHsnCode(p.hsn_code || '');
        setTaxRate(p.tax_rate !== null && p.tax_rate !== undefined ? String(p.tax_rate) : '');
        setShortDescription(p.short_description || '');
        setDescription(p.description || '');
        setSeoTitle(p.seo_title || '');
        setSeoDescription(p.seo_description || '');
        setIsActive(Boolean(p.is_active));
        setIsFeatured(Boolean(p.is_featured));
        setShowOnHomepage(p.show_on_homepage !== false);
        setIsPurchasable(p.is_purchasable !== false);

        // Specifications
        if (p.specifications && typeof p.specifications === 'object') {
          const specEntries = Object.entries(p.specifications).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setSpecs(specEntries);
        }
      } else {
        setLoadError('Product not found.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve product details.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

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
    if (!sourceModelNo.trim() || !hsnCode.trim() || taxRate === '') {
      setError('Model number, HSN code, and GST rate are required.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('A valid selling price greater than 0 is required.');
      return;
    }
    if (stockDirty && (stock.trim() === '' || !Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      setError('Enter a verified, non-negative stock quantity.');
      return;
    }
    if (thresholdDirty && (!Number.isInteger(Number(lowStockThreshold)) || Number(lowStockThreshold) < 0)) {
      setError('Enter a non-negative reorder level.');
      return;
    }
    if (thresholdDirty && !stockDirty && !inventoryId) {
      setError('Enter verified stock before setting a reorder level for this product.');
      return;
    }

    setSaving(true);

    try {
      const specRecord: Record<string, string> = {};
      specs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specRecord[s.key.trim()] = s.value.trim();
        }
      });

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        source_model_no: sourceModelNo.trim(),
        slug: (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category_id: categoryId || undefined,
        brand_id: brandId === '__other__' ? undefined : brandId || undefined,
        custom_brand_name: brandId === '__other__' ? customBrandName.trim() : undefined,
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        hsn_code: hsnCode.trim(),
        tax_rate: Number(taxRate),
        stock: stockDirty ? Number(stock) : undefined,
        lowStockThreshold: stockDirty ? Number(lowStockThreshold) : undefined,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        specifications: specRecord,
        seo_title: seoTitle.trim() || name.trim(),
        seo_description: seoDescription.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
        show_on_homepage: showOnHomepage,
        is_purchasable: isPurchasable
      };

      await updateProduct(productId, payload);
      if (thresholdDirty && !stockDirty && inventoryId) {
        await adjustAdminInventory(inventoryId, { reorderLevel: Number(lowStockThreshold) });
      }
      setStockDirty(false);
      setThresholdDirty(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove "${name}"? If it is referenced by past orders, it will be safely archived.`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      router.push('/admin/products');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product.';
      alert(`Error: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <Loader2 size={36} className="animate-spin" color="#F5C710" />
        <h3>Loading Product Details...</h3>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.stateBox}>
        <AlertCircle size={48} color="#DC2626" />
        <h3>Error Loading Product</h3>
        <p>{loadError}</p>
        <Link href="/admin/products" className={styles.primaryBtn} style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} />
          <span>Return to Products</span>
        </Link>
      </div>
    );
  }

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
            <h1>Edit: {name}</h1>
            <p>SKU: {sku}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '0 14px',
              height: '40px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            <span>Delete</span>
          </button>

          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
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
          <span>Product updated successfully!</span>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label htmlFor="productSku">Product SKU *</label>
                <input
                  id="productSku"
                  type="text"
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sourceModelNo">Manufacturer / Source Model Number *</label>
              <input
                id="sourceModelNo"
                type="text"
                value={sourceModelNo}
                onChange={(e) => setSourceModelNo(e.target.value)}
                required
              />
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
                  <option value="__other__">Other / Add new brand</option>
                </select>
                {brandId === '__other__' && (
                  <input
                    type="text"
                    value={customBrandName}
                    onChange={(e) => setCustomBrandName(e.target.value)}
                    placeholder="Enter brand name"
                    required
                  />
                )}
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
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="fullDesc">Full Technical Description</label>
              <textarea
                id="fullDesc"
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} />
                <span>Show on Homepage</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isPurchasable}
                  onChange={(e) => setIsPurchasable(e.target.checked)}
                />
                <span>Allow Purchase (uncheck to block checkout pending stock verification)</span>
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
                onChange={(e) => { setStock(e.target.value); setStockDirty(true); }}
                min="0"
                placeholder={inventoryId ? undefined : 'Enter verified stock'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lowThreshold">Low Stock Alert Level</label>
              <input
                id="lowThreshold"
                type="number"
                value={lowStockThreshold}
                onChange={(e) => { setLowStockThreshold(e.target.value); setThresholdDirty(true); }}
                min="1"
              />
            </div>
          </div>

          {/* Product Image */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2>Product Image</h2>
            </div>

            <ImageUploadWidget
              productId={productId}
              disabled={saving}
            />
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
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="seoDesc">Meta Description</label>
              <textarea
                id="seoDesc"
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
