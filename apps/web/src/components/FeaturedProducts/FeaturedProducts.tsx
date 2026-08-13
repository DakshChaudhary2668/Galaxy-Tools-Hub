'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FEATURED_PRODUCTS } from '../../data/products';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './FeaturedProducts.module.scss';

export const FeaturedProducts: React.FC = () => {
  return (
    <section className={styles.featuredSection}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>FEATURED INSTRUMENTS</h2>
          <Link href="/catalog" className={styles.viewAllLink}>
            <span>VIEW ALL</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.productsGrid}>
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
