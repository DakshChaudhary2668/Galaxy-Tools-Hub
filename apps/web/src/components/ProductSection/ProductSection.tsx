'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Product } from '../../types/product';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './ProductSection.module.scss';

interface ProductSectionProps {
  title: string;
  products: Product[];
  viewAllHref?: string;
}

export const ProductSection: React.FC<ProductSectionProps> = ({ title, products, viewAllHref = '/products' }) => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{title}</h2>
          <Link href={viewAllHref} className={styles.viewAllLink}>
            <span>VIEW ALL</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
