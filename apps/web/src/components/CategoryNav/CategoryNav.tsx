'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '../../data/products';
import { CategoryMegaMenu } from '../CategoryMegaMenu/CategoryMegaMenu';
import styles from './CategoryNav.module.scss';

export const CategoryNav: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('lab');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const router = useRouter();

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    router.push('/category/lab-testing-items');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <nav className={styles.navContainer} aria-label="Category Navigation">
        <div className={styles.inner}>
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                className={`${styles.navigationItem} ${isActive ? styles.active : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
                onMouseEnter={() => setHoveredCategory(cat.id)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      {hoveredCategory === 'lab' && (
        <CategoryMegaMenu
          categorySlug="lab-testing-items"
          onClose={() => setHoveredCategory(null)}
        />
      )}
    </div>
  );
};
