'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X
} from 'lucide-react';
import {
  deleteProduct,
  updateProduct
} from '@/services/product.service';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { CategoryWithProductCount } from '@/services/category.service';
import { ProductDto, BrandDto } from '@galaxy/types';
import styles from './Products.module.scss';

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const { data: rawCategories = [] } = useCategories();
  const { data: rawBrands = [] } = useBrands();
  const categories: CategoryWithProductCount[] = rawCategories;
  const brands: BrandDto[] = rawBrands;

  // Debounce search term to prevent excessive network requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Construct query parameters; included in TanStack Query key for reactive refetching
  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = {
      page,
      limit: 12,
    };
    if (debouncedSearch.trim()) {
      p.search = debouncedSearch.trim();
    }
    if (categoryFilter) {
      p.category = categoryFilter;
    }
    if (brandFilter) {
      p.brand = brandFilter;
    }
    if (activeFilter !== '') {
      p.active = activeFilter === 'true';
    }
    if (featuredFilter === 'true') {
      p.featured = true;
    }
    return p;
  }, [page, debouncedSearch, categoryFilter, brandFilter, activeFilter, featuredFilter]);

  // Standardized React Query hook: UI -> Hook -> Service -> apiClient -> Backend
  const {
    data: productsResponse,
    isLoading: loading,
    error: queryError,
    refetch: refetchProducts,
  } = useProducts(queryParams);

  const rawProducts = useMemo(() => productsResponse?.data || [], [productsResponse]);
  const totalCount = productsResponse?.meta?.total || rawProducts.length;
  const totalPages = productsResponse?.meta?.totalPages || 1;
  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to retrieve products.' : null;

  // Immediate client-side filtering matching product name, SKU, model number, or brand
  const products = useMemo(() => {
    if (!search.trim()) return rawProducts;
    const term = search.toLowerCase().trim();
    return rawProducts.filter((prod) => {
      const nameMatch = prod.name?.toLowerCase().includes(term);
      const skuMatch = prod.sku?.toLowerCase().includes(term);
      const modelMatch = prod.source_model_no?.toLowerCase().includes(term);
      const brandMatch = brands.find((b) => b.id === prod.brand_id)?.name.toLowerCase().includes(term);
      return nameMatch || skuMatch || modelMatch || brandMatch;
    });
  }, [rawProducts, search, brands]);

  const handleToggleActive = async (product: ProductDto) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      setActionNotice({
        type: 'success',
        message: `Product "${product.name}" is now ${!product.is_active ? 'Active' : 'Inactive'}`
      });
      refetchProducts();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status';
      alert(`Error: ${msg}`);
    }
  };

  const handleDelete = async (product: ProductDto) => {
    if (!confirm(`Are you sure you want to remove "${product.name}"? If it is linked to previous customer orders, it will be safely archived.`)) {
      return;
    }

    try {
      const res = await deleteProduct(product.id);
      setActionNotice({
        type: 'info',
        message: res.message || `Product ${product.name} processed.`
      });
      refetchProducts();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      alert(`Error: ${msg}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategoryFilter('');
    setBrandFilter('');
    setActiveFilter('');
    setFeaturedFilter('');
    setPage(1);
  };

  const formatPrice = (amount?: number | null) =>
    new Intl.NumberFormat('en-IN').format(amount || 0);

  const getCategoryName = (catId?: string) => {
    const c = categories.find((cat) => cat.id === catId);
    return c ? c.name : 'Uncategorized';
  };

  return (
    <div className={styles.productsContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Products & Instruments</h1>
          <p>Manage multimeters, calibration tools, and technical testing instruments.</p>
        </div>

        <Link href="/admin/products/new" className={styles.primaryBtn}>
          <Plus size={16} />
          <span>Add Product</span>
        </Link>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
          {actionNotice.message}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by Product Name, SKU, or Model..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search products"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center'
              }}
              aria-label="Clear search input"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filterSelectGroup}>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by brand"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive / Draft</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by featured"
          >
            <option value="">All Items</option>
            <option value="true">Featured Only</option>
          </select>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetFilters}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={36} className="animate-spin" color="#F5C710" />
            <h3>Loading Catalog...</h3>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={40} color="#DC2626" />
            <h3>Failed to Load Products</h3>
            <p>{error}</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => refetchProducts()}
              style={{ marginTop: '8px' }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.stateBox}>
            <Package size={48} color="#94A3B8" />
            <h3>No Products Found</h3>
            <p>Try adjusting your search criteria or add your first product.</p>
            <Link href="/admin/products/new" className={styles.primaryBtn} style={{ marginTop: '12px' }}>
              <Plus size={16} />
              <span>Add New Product</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.productsTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>GST</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div className={styles.productCell}>
                          <div className={styles.itemThumb}>
                            <Package size={20} />
                          </div>
                          <div className={styles.itemDetails}>
                            <Link href={`/admin/products/${prod.id}/edit`} className={styles.name}>
                              {prod.name}
                            </Link>
                            <span className={styles.sku}>SKU: {prod.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td>{getCategoryName(prod.category_id)}</td>
                      <td className={styles.amountCell}>₹{formatPrice(prod.price)}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                          {prod.tax_rate || 18}% Incl.
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <span
                            className={`${styles.badge} ${prod.is_active ? styles.active : styles.inactive}`}
                          >
                            {prod.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {prod.is_featured && (
                            <span className={`${styles.badge} ${styles.featured}`}>
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <Link
                            href={`/admin/products/${prod.id}/edit`}
                            className={`${styles.actionBtn} ${styles.edit}`}
                            title="Edit Product"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </Link>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.toggle}`}
                            onClick={() => handleToggleActive(prod)}
                            title={prod.is_active ? 'Deactivate Product' : 'Activate Product'}
                          >
                            {prod.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.delete}`}
                            onClick={() => handleDelete(prod)}
                            title="Delete or Archive Product"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.paginationBar}>
              <div>
                Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
              </div>

              <div className={styles.pageControls}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageIndicator}>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
