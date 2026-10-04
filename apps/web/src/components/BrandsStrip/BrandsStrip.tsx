'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBrands } from '@/hooks/useBrands';
import styles from './BrandsStrip.module.scss';

const BRAND_LOGOS = [
  { key: 'bosch', label: 'Bosch', src: '/images/brands/bosch.png' },
  { key: 'makita', label: 'Makita', src: '/images/brands/makita.png' },
  { key: 'stanley', label: 'Stanley', src: '/images/brands/stanley.png' },
  { key: 'fluke', label: 'Fluke', src: '/images/brands/fluke.png' },
  { key: 'ingco', label: 'Ingco', src: '/images/brands/ingco.png' },
  { key: 'taparia', label: 'Taparia', src: '/images/brands/taparia.png' },
  { key: 'gtech', label: 'G-Tech', src: '/images/brands/g-tech.png' },
] as const;

const normalizeBrand = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

export const BrandsStrip: React.FC = () => {
  const { data: brands = [] } = useBrands();
  const logoBrands = BRAND_LOGOS.flatMap((logo) => {
    const brand = brands.find((item) => normalizeBrand(item.name).startsWith(logo.key));
    return brand ? [{ ...logo, id: brand.id }] : [];
  });

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
              {logoBrands.map((brand) => (
                <Link
                  key={`${brand.id}-${duplicate}`}
                  href={`/products?brand=${brand.id}`}
                  className={styles.brandCard}
                  tabIndex={duplicate ? -1 : undefined}
                  aria-label={duplicate ? undefined : `Shop ${brand.label}`}
                >
                  <Image
                    src={brand.src}
                    alt={duplicate ? '' : `${brand.label} logo`}
                    width={220}
                    height={96}
                    className={styles.logo}
                  />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
