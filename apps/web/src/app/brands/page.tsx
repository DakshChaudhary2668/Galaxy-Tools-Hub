'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useBrands } from '@/hooks/useBrands';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { CartDrawer } from '@/components/CartDrawer/CartDrawer';
import styles from '../categories/Categories.module.scss'; // reuse identical layout styles

export default function BrandsPage() {
  const { data: brands = [], isLoading, error } = useBrands();
  const active = brands.filter((b) => b.is_active !== false);

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />

      <main className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <strong>Brands</strong>
        </nav>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Shop by Brand</h1>
          <p className={styles.pageSubtitle}>
            Authorised distributor for all major professional instrument brands.
          </p>
        </header>

        {isLoading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={36} color="#EF4444" />
            <p>Failed to load brands. Please try again.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {active.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.id}`}
                className={styles.card}
              >
                <div className={styles.cardBody}>
                  <h2 className={styles.cardName}>{brand.name}</h2>
                  {brand.description && (
                    <p className={styles.cardDesc}>{brand.description}</p>
                  )}
                </div>
                <ArrowRight size={16} className={styles.arrow} />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
