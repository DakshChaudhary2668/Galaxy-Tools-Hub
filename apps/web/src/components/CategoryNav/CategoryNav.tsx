'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES } from '../../data/products';
import { CategoryMegaMenu, CATEGORY_MENUS } from '../CategoryMegaMenu/CategoryMegaMenu';
import styles from './CategoryNav.module.scss';

/** IDs that have a mega-menu dropdown */
const MENU_IDS = new Set(Object.keys(CATEGORY_MENUS));

export const CategoryNav: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── open / close helpers ────────────────────────────────────────────────
  const open = useCallback((id: string) => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    if (MENU_IDS.has(id)) setOpenCategory(id);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpenCategory(null), 120);
  }, []);

  const close = useCallback(() => setOpenCategory(null), []);

  // ── outside click ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [close]);

  // ── escape key ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close]);

  // ── cleanup timer on unmount ────────────────────────────────────────────
  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  return (
    <div ref={navRef} style={{ position: 'relative', width: '100%' }}>
      <nav className={styles.navContainer} aria-label="Category Navigation">
        <div className={styles.inner}>
          {CATEGORIES.map((cat) => {
            const isOpen = cat.id === openCategory;
            const hasMenu = MENU_IDS.has(cat.id);
            return (
              <button
                key={cat.id}
                className={`${styles.navigationItem} ${isOpen ? styles.active : ''}`}
                onClick={() => { isOpen ? close() : open(cat.id); }}
                onMouseEnter={() => open(cat.id)}
                onMouseLeave={scheduleClose}
                aria-haspopup={hasMenu ? 'true' : undefined}
                aria-expanded={hasMenu ? isOpen : undefined}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      {openCategory && MENU_IDS.has(openCategory) && (
        <div
          onMouseEnter={() => open(openCategory)}
          onMouseLeave={scheduleClose}
        >
          <CategoryMegaMenu categoryId={openCategory} onClose={close} />
        </div>
      )}
    </div>
  );
};
