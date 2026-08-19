'use client';

import React from 'react';
import { BRAND_LIST } from '../../data/homepageSeed';
import styles from './BrandsStrip.module.scss';

export const BrandsStrip: React.FC = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>OUR BRANDS</h2>
        <div className={styles.grid}>
          {BRAND_LIST.map((brand) => (
            <div key={brand.id} className={styles.brandPill}>
              {brand.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
