'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { CartDrawer } from '@/components/CartDrawer/CartDrawer';
import { CategoryDto, BrandDto } from '@galaxy/types';
import styles from './Products.module.scss';

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read state from URL
  const search = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'latest';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = 16;

  // Local draft avoids changing the URL until the search form is submitted.
  const [localSearch, setLocalSearch] = React.useState(search);

  // Sync local search when URL changes externally
  useEffect(() => {
    setLocalSearch(search);
  }, [search, searchParams]);

  // Fetch reference data for filters
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // Construct query params for the API
  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = {
      page,
      limit,
      active: 'true', // Only show active products to customers
    };
    if (search.trim()) p.search = search.trim();
    if (categoryFilter) p.category = categoryFilter;
    if (brandFilter) p.brand = brandFilter;
    if (sort) p.sort = sort;
    return p;
  }, [page, limit, search, categoryFilter, brandFilter, sort]);

  // Fetch live products
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch
  } = useProducts(queryParams);

  const products = productsResponse?.data || [];
  const totalCount = productsResponse?.meta?.total || 0;
  const totalPages = productsResponse?.meta?.totalPages || 1;

  // URL update helper
  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // Reset page to 1 if we are changing filters/search/sort
      if (!updates.page && (updates.search !== undefined || updates.category !== undefined || updates.brand !== undefined || updates.sort !== undefined)) {
         params.set('page', '1');
      }
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ''}`);
    },
    [searchParams, pathname, router]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: localSearch.trim().replace(/\s+/g, ' ') });
  };

  const clearAllFilters = () => {
    updateQuery({ search: null, category: null, brand: null, sort: 'latest', page: '1' });
    setLocalSearch('');
  };

  // Build active filters for tags
  const activeTags = [];
  if (search) activeTags.push({ key: 'search', label: `"${search}"` });
  if (categoryFilter) {
    const cat = (categories as CategoryDto[]).find(c => c.id === categoryFilter || c.slug === categoryFilter);
    activeTags.push({ key: 'category', label: cat?.name || categoryFilter });
  }
  if (brandFilter) {
    const b = (brands as BrandDto[]).find(b => b.id === brandFilter || b.slug === brandFilter);
    activeTags.push({ key: 'brand', label: b?.name || brandFilter });
  }

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />

      <main className={styles.container}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <strong>All Products</strong>
        </nav>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Industrial Equipment Catalog</h1>
          <p className={styles.pageSubtitle}>
            Browse our comprehensive range of professional testing and measurement instruments.
          </p>
        </header>

        {/* Toolbar (Search & Filters) */}
        <div className={styles.toolbar}>
          <form className={styles.searchWrap} onSubmit={handleSearchSubmit} role="search">
            <button type="submit" className={styles.searchSubmit} aria-label="Search products">
              <Search size={16} />
            </button>
            <input
              type="text"
              placeholder="Search by SKU, Name, or Parameter..."
              className={styles.searchInput}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              maxLength={100}
              aria-label="Search by SKU, name, or parameter"
            />
            {localSearch && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => { setLocalSearch(''); updateQuery({ search: null }); }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div className={styles.divider} />

          <div className={styles.toolbarFilters}>
            <select
              className={styles.filterSelect}
              value={categoryFilter}
              onChange={(e) => updateQuery({ category: e.target.value })}
              aria-label="Filter by Category"
            >
              <option value="">All Categories</option>
              {(categories as CategoryDto[]).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={brandFilter}
              onChange={(e) => updateQuery({ brand: e.target.value })}
              aria-label="Filter by Brand"
            >
              <option value="">All Brands</option>
              {(brands as BrandDto[]).map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={sort}
              onChange={(e) => updateQuery({ sort: e.target.value })}
              aria-label="Sort products"
            >
              <option value="latest">Sort: Newest First</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Results Meta & Active Tags */}
        <div className={styles.resultMeta}>
          <div className={styles.resultCount}>
            Showing <strong>{products.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
            <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> Instruments
          </div>

          {activeTags.length > 0 && (
            <div className={styles.activeFilters}>
              {activeTags.map((tag) => (
                <span key={tag.key} className={styles.filterTag}>
                  {tag.label}
                  <button onClick={() => updateQuery({ [tag.key]: null })} aria-label={`Remove ${tag.label} filter`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button className={styles.clearAllBtn} onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className={styles.stateBox}>
            <div className={`${styles.stateIcon} ${styles.error}`}>
              <AlertCircle size={28} color="#EF4444" />
            </div>
            <h2 className={styles.stateTitle}>Unable to Load Catalog</h2>
            <p className={styles.stateText}>
              We encountered an issue connecting to our product database. Please try again or contact support if the issue persists.
            </p>
            <button className={styles.retryBtn} onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className={styles.stateBox}>
            <div className={`${styles.stateIcon} ${styles.empty}`}>
              <Package size={28} color="#B45309" />
            </div>
            <h2 className={styles.stateTitle}>No Instruments Found</h2>
            <p className={styles.stateText}>
              We couldn't find any products matching your current filters. Try adjusting your search or clearing active filters.
            </p>
            <button className={styles.retryBtn} onClick={clearAllFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          /* Product Grid */
          <>
            <div className={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => updateQuery({ page: String(page - 1) })}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  // Simple pagination: show first, last, and +/- 1 from current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`${styles.pageBtn} ${page === pageNum ? styles.active : ''}`}
                        onClick={() => updateQuery({ page: String(pageNum) })}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === page - 2 ||
                    pageNum === page + 2
                  ) {
                    return <span key={pageNum} className={styles.pageEllipsis}>...</span>;
                  }
                  return null;
                })}

                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => updateQuery({ page: String(page + 1) })}
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
