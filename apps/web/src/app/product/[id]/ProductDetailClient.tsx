'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { ProductView } from '@galaxy/types';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { formatBasePrice, getAvailability, getProductInformation } from '@/lib/productDisplay';
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
    currency: '₹',
    gstIncluded: false
  };
  const availability = getAvailability(mappedProduct);
  const productInformation = getProductInformation(mappedProduct);

  const thumbs = (product.images && product.images.length > 0)
    ? (product.images as any[]).map(img => img.image_url).slice(0, 6)
    : ['/images/placeholder.jpg'];

  const relatedProducts = (relatedData?.data || [])
    .filter((p: any) => p.id !== product.id)
    .slice(0, 5);

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
            {availability.label && <span className={styles.stockTag}>{availability.label}</span>}
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
                  aria-label={`View image ${idx + 1} of ${product.name}`}
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

          {product.source_model_no && <div className={styles.modelText}>Model: {product.source_model_no}</div>}

          <div className={styles.priceBlock}>
            <div className={styles.priceVal}>{formatBasePrice(product.price)}</div>
            <div className={styles.priceDisclosure}>Base price <span>+ {product.tax_rate ?? 18}% GST</span></div>
            <div className={styles.freightDisclosure}>Freight calculated at checkout</div>
          </div>

          <div className={styles.divider} />

          {(product.short_description || product.description) && (
            <p className={styles.summaryText}>{product.short_description || product.description}</p>
          )}

          {/* CTAs */}
          <div className={styles.ctaStack}>
            <button
              className={styles.addToCartBtn}
              onClick={() => availability.available && addToCart(mappedProduct)}
              disabled={!availability.available}
            >
              <ShoppingCart size={18} />
              <span>{availability.available ? 'ADD TO CART' : availability.label?.toUpperCase()}</span>
            </button>

            <button
              className={styles.buyNowBtn}
              disabled={!availability.available}
              onClick={() => {
                if (!availability.available) return;
                addToCart(mappedProduct);
                window.location.href = '/checkout';
              }}
            >
              <Zap size={18} />
              <span>BUY NOW</span>
            </button>
          </div>

          {productInformation.warranty && (
            <div className={styles.warrantyNote}>
              <strong>Manufacturer warranty</strong>
              <span>{productInformation.warranty}</span>
            </div>
          )}
        </section>
      </div>

      {(product.description || productInformation.technicalSpecifications.length > 0 || productInformation.features.length > 0 || productInformation.packageIncludes.length > 0 || productInformation.applications.length > 0 || productInformation.warranty) && (
        <section className={styles.productInformation}>
          <header className={styles.informationHeader}>
            <span>Product information</span>
            <h2>Everything you need to know</h2>
          </header>

          {product.description && (
            <div className={styles.informationRow}>
              <h3>Overview</h3>
              <p className={styles.descriptionText}>{product.description}</p>
            </div>
          )}

          {productInformation.technicalSpecifications.length > 0 && (
            <div className={styles.informationRow}>
              <h3>Technical specifications</h3>
              <dl className={styles.specificationGrid}>
                {productInformation.technicalSpecifications.map(({ label, value }) => (
                  <div key={label} className={styles.specificationItem}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {productInformation.features.length > 0 && (
            <div className={styles.informationRow}>
              <h3>Features</h3>
              <ul className={styles.detailList}>{productInformation.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </div>
          )}

          {productInformation.packageIncludes.length > 0 && (
            <div className={styles.informationRow}>
              <h3>Package includes</h3>
              <ul className={styles.detailList}>{productInformation.packageIncludes.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}

          {productInformation.applications.length > 0 && (
            <div className={styles.informationRow}>
              <h3>Applications</h3>
              <ul className={styles.detailList}>{productInformation.applications.map((application) => <li key={application}>{application}</li>)}</ul>
            </div>
          )}

          {productInformation.warranty && (
            <div className={styles.informationRow}>
              <h3>Warranty</h3>
              <p>{productInformation.warranty}</p>
            </div>
          )}
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
         <section className={styles.relatedSection}>
           <h2 className={styles.tableTitle}>Related Instruments</h2>
           <div className={styles.relatedGrid}>
             {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p as unknown as ProductView} />
             ))}
           </div>
         </section>
      )}
    </main>
  );
}
