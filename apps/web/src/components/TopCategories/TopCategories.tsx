'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TOP_CATEGORIES } from '../../data/homepageSeed';
import styles from './TopCategories.module.scss';

export const TopCategories: React.FC = () => {
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

        <div className={styles.grid}>
          {TOP_CATEGORIES.map((cat) => (
            <Link key={cat.id} href={cat.href} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={280}
                  height={180}
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
      </div>
    </section>
  );
};
