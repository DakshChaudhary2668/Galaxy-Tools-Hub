'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, ShoppingCart, Zap, ShieldCheck, RefreshCw, Headphones, AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { ProductView } from '@galaxy/types';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import styles from './ProductDetail.module.scss';

export default function ProductDetailClient({ id }: { id: string }) {
  const [selectedThumb, setSelectedThumb] = useState(0);
  const { addToCart } = useCartStore();

  const { data: productData, isLoading, error } = useProduct(id);
  const product = productData;

  // Fetch related products from the same category
  const { data: relatedData } = useProducts(
    { category: product?.category_id, limit: 5 },
    { enabled: !!product?.category_id }
  );

  if (isLoading) {
    return (
      <main className={styles.container}>
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <RefreshCw className={styles.loadingSpinner} size={32} />
          <p style={{ marginTop: 16 }}>Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className={styles.container}>
        <div style={{ padding: '100px 20px', textAlign: 'center', background: '#fff', border: '1px solid #eaeaea', margin: '40px 0', borderRadius: '4px' }}>
          <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Product Not Found</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            The instrument you are looking for may have been removed or the URL is incorrect.
          </p>
          <Link href="/products" style={{ display: 'inline-block', padding: '10px 24px', background: '#111', color: '#fff', textDecoration: 'none', fontWeight: 700, borderRadius: '2px' }}>
            BROWSE CATALOG
          </Link>
        </div>
      </main>
    );
  }

  const mappedProduct: ProductView = {
    ...product,
    image: (product.images && product.images.length > 0) ? (product.images[0] as any).image_url : '/images/placeholder.jpg',
    statusLabel: (product.inventory_quantity ?? 1) > 0 ? 'IN STOCK' : 'OUT OF STOCK',
    currency: '₹',
    gstIncluded: false
  };

  const thumbs = (product.images && product.images.length > 0)
    ? (product.images as any[]).map(img => img.image_url).slice(0, 6)
    : ['/images/placeholder.jpg'];

  const specifications = product.specifications as Record<string, string>;
  const specKeys = specifications ? Object.keys(specifications) : [];

  const relatedProducts = (relatedData?.data || [])
    .filter((p: any) => p.id !== product.id)
    .slice(0, 4);

  return (
    <main className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href="/products">All Products</Link>
        <span>›</span>
        <strong>{product.name}</strong>
      </div>

      <div className={styles.productLayout}>
        {/* Gallery Left */}
        <section className={styles.gallerySection}>
          <div
            className={styles.mainImageCard}
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty('--zoom-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
              event.currentTarget.style.setProperty('--zoom-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
            }}
          >
            <span className={styles.stockTag}>{mappedProduct.statusLabel}</span>
            <Image
              src={thumbs[selectedThumb] || thumbs[0]}
              alt={product.name}
              width={420}
              height={380}
              className={styles.mainImg}
              priority
            />
          </div>

          {thumbs.length > 1 && (
            <div className={styles.thumbnailRow}>
              {thumbs.map((thumb, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumbCard} ${selectedThumb === idx ? styles.active : ''}`}
                  onClick={() => setSelectedThumb(idx)}
                >
                  <Image
                    src={thumb}
                    alt={`Thumbnail ${idx + 1}`}
                    width={70}
                    height={70}
                    className={styles.thumbImg}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Info Section Right */}
        <section className={styles.infoSection}>
          <div className={styles.brandSkuRow}>
            <div className={styles.brandText}>{product.brand?.name || 'GALAXY TOOLS'}</div>
            <span className={styles.skuBadge}>SKU: {product.sku}</span>
          </div>

          <h1 className={styles.productTitle}>
            {product.name}
          </h1>

          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
              <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
              <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
              <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
              <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
            </div>
            <span className={styles.reviewText}>Model: {product.source_model_no || 'N/A'}</span>
          </div>

          <div className={styles.priceBlock}>
            <div className={styles.priceVal}>₹{new Intl.NumberFormat('en-IN').format(product.price || 0)}</div>
            {product.compare_at_price && product.price != null && product.compare_at_price > product.price && (
               <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '16px', marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                 ₹{new Intl.NumberFormat('en-IN').format(product.compare_at_price)}
               </div>
            )}
            <div className={styles.gstSub} style={{ marginLeft: product.compare_at_price && product.price != null && product.compare_at_price > product.price ? '12px' : '0' }}>INCL. GST & SHIPPING</div>
          </div>

          <div className={styles.divider} />

          <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            {product.short_description || product.description || 'Professional grade industrial equipment.'}
          </p>

          {/* CTAs */}
          <div className={styles.ctaStack}>
            <button
              className={styles.addToCartBtn}
              onClick={() => addToCart(mappedProduct)}
            >
              <ShoppingCart size={18} />
              <span>ADD TO CART</span>
            </button>

            <button
              className={styles.buyNowBtn}
              onClick={() => {
                addToCart(mappedProduct);
                window.location.href = '/checkout';
              }}
            >
              <Zap size={18} />
              <span>BUY NOW</span>
            </button>
          </div>

          {/* Guarantees Strip */}
          <div className={styles.guaranteesRow}>
            <div className={styles.guaranteeItem}>
              <ShieldCheck size={16} />
              <span>1 YR WARRANTY</span>
            </div>
            <div className={styles.guaranteeItem}>
              <RefreshCw size={16} />
              <span>7 DAY RETURN</span>
            </div>
            <div className={styles.guaranteeItem}>
              <Headphones size={16} />
              <span>24/7 SUPPORT</span>
            </div>
          </div>
        </section>
      </div>

      {/* Technical Specifications Table */}
      {specKeys.length > 0 && (
        <section className={styles.specsTableSection}>
          <h2 className={styles.tableTitle}>Technical Specifications</h2>
          <table className={styles.specsTable}>
            <tbody>
              {specKeys.map(key => (
                <tr key={key}>
                  <th style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</th>
                  <td>{specifications[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Description */}
      {product.description && (
         <section className={styles.specsTableSection} style={{ marginTop: '40px' }}>
            <h2 className={styles.tableTitle}>Product Description</h2>
            <div style={{ fontSize: '15px', color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {product.description}
            </div>
         </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
         <section style={{ marginTop: '60px' }}>
           <h2 className={styles.tableTitle} style={{ marginBottom: '24px' }}>Related Instruments</h2>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
             {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p as unknown as ProductView} />
             ))}
           </div>
         </section>
      )}
    </main>
  );
}
