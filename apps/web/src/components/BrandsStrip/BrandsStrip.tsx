'use client';

import React from 'react';
import Link from 'next/link';
import { useBrands } from '@/hooks/useBrands';
import styles from './BrandsStrip.module.scss';

export const BrandsStrip: React.FC = () => {
  const { data: brands = [] } = useBrands();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>OUR BRANDS</h2>
        <div className={styles.grid}>
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.id}`}
              className={styles.brandPill}
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
