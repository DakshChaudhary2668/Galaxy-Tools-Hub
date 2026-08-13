'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../../types/product';
import { useCartStore } from '../../store/useCartStore';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCartStore();
  const router = useRouter();

  const formattedPrice = new Intl.NumberFormat('en-IN').format(product.price);

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <div className={styles.card}>
      {/* Image Area */}
      <div className={styles.imageArea} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <span className={styles.statusBadge}>{product.statusLabel}</span>
        <Image
          src={product.image}
          alt={product.name}
          width={220}
          height={180}
          className={styles.productImage}
        />
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        <span className={styles.category}>{product.category}</span>
        <h3
          className={styles.title}
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
        >
          {product.name}
        </h3>
        <div className={styles.priceRow}>
          <span className={styles.price}>{product.currency}{formattedPrice}</span>
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
      <div className={styles.footerSpecs}>
        {product.technicalSpecs}
      </div>
    </div>
  );
};
