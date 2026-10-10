'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { ProductView } from '@galaxy/types';
import { useCartStore } from '../../store/useCartStore';
import { formatBasePrice, getAvailability } from '@/lib/productDisplay';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: ProductView;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCartStore();
  const imageUrl = product.image || (product as any).image_url || (product.images && product.images.length > 0 ? (product.images[0] as any).image_url : null) || '/images/placeholder.jpg';
  const productHref = `/product/${product.id}`;
  const availability = getAvailability(product);

  return (
    <div className={styles.card}>
      <Link className={styles.imageArea} href={productHref} aria-label={`View ${product.name}`}>
        {availability.label && <span className={styles.statusBadge}>{availability.label}</span>}
        <Image
          src={imageUrl}
          alt={product.name || 'Product Image'}
          width={220}
          height={180}
          className={styles.productImage}
        />
      </Link>

      {/* Content Area */}
      <div className={styles.contentArea}>
        <h3 className={styles.title}><Link href={productHref}>{product.name}</Link></h3>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatBasePrice(product.price, product.currency || '₹')}</span>
        </div>

        {product.secondaryAction === 'SPECS' ? (
          <button
            className={styles.specsBtn}
            onClick={() => window.location.assign(productHref)}
          >
            <Eye size={15} />
            <span>SPECS</span>
          </button>
        ) : (
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={!availability.available}
            aria-label={`Add ${product.name} to quote`}
          >
            <ShoppingCart size={15} />
            <span>{availability.available ? 'ADD TO QUOTE' : availability.label?.toUpperCase()}</span>
          </button>
        )}
      </div>
    </div>
  );
};
