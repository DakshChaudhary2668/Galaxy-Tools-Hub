'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBrands } from '@/hooks/useBrands';
import styles from './BrandsStrip.module.scss';

const BRAND_LOGOS = [
  { key: 'beetech', label: 'Beetech', src: '/images/brands/beetech.png' },
  { key: 'hioki', label: 'Hioki', src: '/images/brands/hioki.png' },
  { key: 'htc', label: 'HTC', src: '/images/brands/htc.png' },
  { key: 'fluke', label: 'Fluke', src: '/images/brands/fluke.png' },
  { key: 'kyoritsu', label: 'Kyoritsu', src: '/images/brands/kyoritsu.png' },
  { key: 'lutron', label: 'Lutron', src: '/images/brands/lutron.png' },
  { key: 'kusammeco', label: 'Kusam-Meco', src: '/images/brands/kusam-meco.png' },
  { key: 'meco', label: 'MECO', src: '/images/brands/meco.png' },
  { key: 'metravi', label: 'Metravi', src: '/images/brands/metravi.png' },
  { key: 'mextech', label: 'Mextech', src: '/images/brands/mextech.png' },
  { key: 'mastech', label: 'Mastech', src: '/images/brands/mastech.png' },
  { key: 'rtek', label: 'R-Tek', src: '/images/brands/r-tek.png' },
  { key: 'testo', label: 'Testo', src: '/images/brands/testo.png' },
  { key: 'rishabh', label: 'Rishabh', src: '/images/brands/rishabh.png' },
  { key: 'waco', label: 'WACO', src: '/images/brands/waco.png' },
  { key: 'unit', label: 'UNI-T', src: '/images/brands/uni-t.png' },
] as const;

const normalizeBrand = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

export const BrandsStrip: React.FC = () => {
  const { data: brands = [] } = useBrands();
  const logoBrands = BRAND_LOGOS.map((logo) => ({
    ...logo,
    id: brands.find((item) => normalizeBrand(item.name) === logo.key)?.id,
  }));

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
                  key={`${brand.key}-${duplicate}`}
                  href={
                    brand.id
                      ? `/products?brand=${brand.id}`
                      : `/products?search=${encodeURIComponent(brand.label)}`
                  }
                  className={styles.brandCard}
                  tabIndex={duplicate ? -1 : undefined}
                  aria-label={duplicate ? undefined : `Shop ${brand.label}`}
                >
                  <Image
                    src={brand.src}
                    alt={duplicate ? '' : `${brand.label} logo`}
                    width={180}
                    height={63}
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
