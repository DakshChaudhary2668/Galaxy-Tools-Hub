'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { getCategoryImage } from '@/lib/categoryImages';
import styles from './TopCategories.module.scss';

export const TopCategories: React.FC = () => {
  const { data: categories = [] } = useCategories();
  // Show up to 10 active categories
  const top = categories.filter((c) => c.is_active !== false).slice(0, 10);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>TOP CATEGORIES</h2>
          <Link href="/categories" className={styles.viewAllLink}>
            <span>VIEW ALL</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {top.length > 0 && (
          <div className={styles.grid}>
            {top.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.id}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  <Image
                    src={getCategoryImage(cat)}
                    alt={`${cat.name} category`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className={styles.cardImage}
                  />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardName}>{cat.name}</span>
                  <span className={styles.explore}>
                    Explore <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
