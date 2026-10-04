'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  createProduct,
  getProductImageUploadUrl,
  completeProductImage
} from '@/services/product.service';
import { supabase } from '@/lib/supabase';
import { ImageUploadWidget } from '@/components/admin/ImageUploadWidget';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { CategoryWithProductCount } from '@/services/category.service';
import { BrandDto, VendorDto } from '@galaxy/types';
import { apiClient } from '@/services/api';
import styles from '../Products.module.scss';

interface SpecPair {
  key: string;
  value: string;
}


export default function AdminNewProductPage() {
  const router = useRouter();
  const { data: rawCategories = [] } = useCategories();
  const { data: rawBrands = [] } = useBrands();
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => (await apiClient.get<{ data: VendorDto[] }>('/vendors')).data
  });
  const categories: CategoryWithProductCount[] = rawCategories;
  const brands: BrandDto[] = rawBrands;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [sourceModelNo, setSourceModelNo] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [price, setPrice] = useState<string>('');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [hsnCode, setHsnCode] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnHomepage, setShowOnHomepage] = useState(false);
  const [isPurchasable, setIsPurchasable] = useState(false);

  const [specs, setSpecs] = useState<SpecPair[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveStepText, setSaveStepText] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [retryingImage, setRetryingImage] = useState(false);
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

  const uploadProductImage = async (prodId: string, file: File) => {
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const signResult = await getProductImageUploadUrl({
      product_id: prodId,
      mime_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      file_size: file.size,
      extension: ext
    });

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .uploadToSignedUrl(signResult.path, signResult.token, file, {
        contentType: file.type
      });

    if (uploadError) {
      const putRes = await fetch(signResult.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed: ${uploadError.message || putRes.statusText}`);
      }
    }

    await completeProductImage(prodId, {
      storage_path: signResult.path
    });
  };

  const handleRetryImageUpload = async () => {
    if (!createdProductId || selectedImageFiles.length === 0) return;
    setRetryingImage(true);
    setImageUploadError(null);
    try {
      for (let index = 0; index < selectedImageFiles.length; index += 1) {
        try { await uploadProductImage(createdProductId, selectedImageFiles[index]); }
        catch (uploadError) { setSelectedImageFiles(selectedImageFiles.slice(index)); throw uploadError; }
      }
      setSelectedImageFiles([]);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed.';
      setImageUploadError(`Retry failed: ${msg}`);
    } finally {
      setRetryingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImageUploadError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('Product SKU is required.');
      return;
    }
    if (!sourceModelNo.trim() || !categoryId || (brandId === '__other__' ? !customBrandName.trim() : !brandId) || !vendorId) {
      setError('Model number, category, brand, and source vendor are required.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('A valid selling price greater than 0 is required.');
      return;
    }
    if (stock.trim() === '' || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      setError('Enter a verified, non-negative stock quantity.');
      return;
    }
    if (!hsnCode.trim() || taxRate === '') {
      setError('Enter the verified HSN code and GST rate.');
      return;
    }

    setSaving(true);
    setSaveStepText('Creating product record...');

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
        source_model_no: sourceModelNo.trim(),
        source_vendor_id: vendorId,
        category_id: categoryId,
        brand_id: brandId === '__other__' ? undefined : brandId,
        custom_brand_name: brandId === '__other__' ? customBrandName.trim() : undefined,
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        hsn_code: hsnCode.trim(),
        tax_rate: Number(taxRate),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold) || 5,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        specifications: specRecord,
        seo_title: seoTitle.trim() || name.trim(),
        seo_description: seoDescription.trim() || shortDescription.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
        show_on_homepage: showOnHomepage,
        is_purchasable: isPurchasable
      };

      const newProduct = await createProduct(payload);
      setCreatedProductId(newProduct.id);

      // Correction 2: Create-then-upload sequence
      if (selectedImageFiles.length > 0) {
        setSaveStepText('Uploading product images...');
        try {
          for (let index = 0; index < selectedImageFiles.length; index += 1) {
            try { await uploadProductImage(newProduct.id, selectedImageFiles[index]); }
            catch (uploadError) { setSelectedImageFiles(selectedImageFiles.slice(index)); throw uploadError; }
          }
          setSelectedImageFiles([]);
          setSuccess(true);
          setTimeout(() => {
            router.push('/admin/products');
          }, 1200);
        } catch (imgErr: unknown) {
          const msg = imgErr instanceof Error ? imgErr.message : 'Image upload failed';
          // DO NOT delete the valid product! Keep product and allow retry
          setImageUploadError(`Product "${newProduct.name}" created successfully, but image upload failed: ${msg}. You can retry upload below or manage the image in Edit Product.`);
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/products');
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product.';
      setError(msg);
    } finally {
      setSaving(false);
      setSaveStepText('');
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

        <button type="submit" className={styles.primaryBtn} disabled={saving || retryingImage}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? (saveStepText || 'Creating Product...') : 'Save Product'}</span>
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {imageUploadError && (
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '14px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <AlertCircle size={18} />
            <span>{imageUploadError}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {selectedImageFiles.length > 0 && createdProductId && (
              <button
                type="button"
                onClick={handleRetryImageUpload}
                disabled={retryingImage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#92400E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: retryingImage ? 'not-allowed' : 'pointer'
                }}
              >
                {retryingImage ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                <span>{retryingImage ? 'Retrying Upload...' : 'Retry Image Upload'}</span>
              </button>
            )}
            {createdProductId && (
              <Link
                href={`/admin/products/${createdProductId}/edit`}
                style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textDecoration: 'underline' }}
              >
                Go to Edit Product
              </Link>
            )}
          </div>
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

            <div className={styles.formGroup}>
              <label htmlFor="sourceVendor">Source Vendor *</label>
              <select id="sourceVendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
                <option value="">Select Vendor...</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
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
                  required
                >
                  <option value="">Select verified GST rate...</option>
                  <option value="18">18% (Standard GST)</option>
                  <option value="12">12% (Reduced)</option>
                  <option value="28">28% (Luxury/Special)</option>
                  <option value="0">0% (Exempt)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="hsnCode">HSN Code *</label>
                <input
                  id="hsnCode"
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  required
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} />
                <span>Show on Homepage</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={isPurchasable} onChange={(e) => setIsPurchasable(e.target.checked)} />
                <span>Allow Purchase</span>
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
                placeholder="Enter verified stock"
                required
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

            <ImageUploadWidget
              onFilesChange={(files) => {
                setSelectedImageFiles(files);
                setImageUploadError(null);
              }}
              disabled={saving || retryingImage}
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
