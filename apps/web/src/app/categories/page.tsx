'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Package, AlertCircle } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { CartDrawer } from '@/components/CartDrawer/CartDrawer';
import { getCategoryImage } from '@/lib/categoryImages';
import styles from './Categories.module.scss';

export default function CategoriesPage() {
  const { data: categories = [], isLoading, error } = useCategories();
  const active = categories.filter((c) => c.is_active !== false);

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />

      <main className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <strong>Categories</strong>
        </nav>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Browse by Category</h1>
          <p className={styles.pageSubtitle}>
            Explore our complete range of professional testing and measurement instruments.
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
            <p>Failed to load categories. Please try again.</p>
          </div>
        ) : active.length === 0 ? (
          <div className={styles.stateBox}>
            <Package size={36} color="#B45309" />
            <p>No categories available yet.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {active.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className={styles.card}
              >
                <div className={styles.cardImageWrap}>
                  <Image
                    src={getCategoryImage(cat)}
                    alt={`${cat.name} category`}
                    fill
                    sizes="(max-width: 640px) 112px, 96px"
                    className={styles.cardImage}
                  />
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardName}>{cat.name}</h2>
                  {cat.description && (
                    <p className={styles.cardDesc}>{cat.description}</p>
                  )}
                  {cat.product_count != null && (
                    <span className={styles.productCount}>
                      {cat.product_count} Products
                    </span>
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
