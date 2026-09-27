'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Eye } from 'lucide-react';
import { ProductView } from '@galaxy/types';
import { useCartStore } from '../../store/useCartStore';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: ProductView;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCartStore();
  const router = useRouter();

  const formattedPrice = product.price ? new Intl.NumberFormat('en-IN').format(product.price) : '0';
  const formattedOriginal = product.compare_at_price
    ? new Intl.NumberFormat('en-IN').format(product.compare_at_price)
    : null;

  const imageUrl = product.image || (product as any).image_url || (product.images && product.images.length > 0 ? (product.images[0] as any).image_url : null) || '/images/placeholder.jpg';
  const categoryName = product.category?.name || 'Uncategorized';

  let technicalSpecs = product.technicalSpecs;
  if (!technicalSpecs && product.specifications && typeof product.specifications === 'object') {
    const specsObj = product.specifications as Record<string, any>;
    const specsList = Object.entries(specsObj).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
    if (specsList.length > 0) {
      technicalSpecs = specsList.slice(0, 2).join(' • ');
    }
  }

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <div className={styles.card}>
      {/* Image Area */}
      <div className={styles.imageArea} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {product.statusLabel && <span className={styles.statusBadge}>{product.statusLabel}</span>}
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
        {product.discount && product.discount > 0 && (
          <span className={styles.discountBadge}>{product.discount}% OFF</span>
        )}
        <Image
          src={imageUrl}
          alt={product.name || 'Product Image'}
          width={220}
          height={180}
          className={styles.productImage}
        />
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        <span className={styles.category}>{categoryName}</span>
        <h3
          className={styles.title}
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
        >
          {product.name}
        </h3>
        <div className={styles.priceRow}>
          <span className={styles.price}>{product.currency || '₹'}{formattedPrice}</span>
          {formattedOriginal && (
            <span className={styles.originalPrice}>{product.currency || '₹'}{formattedOriginal}</span>
          )}
          {product.gstIncluded && <span className={styles.gstLabel}>GST Inc.</span>}
        </div>

        {product.secondaryAction === 'SPECS' ? (
          <button
            className={styles.specsBtn}
            onClick={handleCardClick}
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
            aria-label={`Add ${product.name} to quote`}
          >
            <ShoppingCart size={15} />
            <span>ADD TO QUOTE</span>
          </button>
        )}
      </div>

      {/* Technical Specs Footer */}
      {technicalSpecs && (
        <div className={styles.footerSpecs}>
          {technicalSpecs}
        </div>
      )}
    </div>
  );
};
