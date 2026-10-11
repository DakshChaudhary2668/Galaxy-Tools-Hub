'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBrands } from '@/hooks/useBrands';
import styles from './BrandsStrip.module.scss';

export const BrandsStrip: React.FC = () => {
  const { data: brands = [] } = useBrands();
  if (!brands.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>OUR BRANDS</h2>
      </div>

      <div className={styles.marquee} aria-label="Featured brands">
        <div className={styles.track}>
          {[false, true].map((duplicate) => (
            <div
              key={String(duplicate)}
              className={styles.logoSet}
              aria-hidden={duplicate || undefined}
            >
              {brands.map((brand) => (
                <Link
                  key={`${brand.id}-${duplicate}`}
                  href={`/products?brand=${brand.id}`}
                  className={styles.brandCard}
                  tabIndex={duplicate ? -1 : undefined}
                  aria-label={duplicate ? undefined : `Shop ${brand.name}`}
                >
                  {brand.logo_url ? (
                    <Image
                      src={brand.logo_url}
                      alt={duplicate ? '' : `${brand.name} logo`}
                      width={180}
                      height={63}
                      className={styles.logo}
                    />
                  ) : <span className={styles.brandName}>{brand.name}</span>}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
