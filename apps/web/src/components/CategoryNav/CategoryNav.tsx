'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
const CATEGORIES = [
  { id: 'testing', label: 'TESTING & MEASUREMENT' },
  { id: 'environmental', label: 'ENVIRONMENT' },
  { id: 'lab', label: 'LABORATORY / LAB TESTING' },
  { id: 'accessories', label: 'ACCESSORIES' },
];
import { CategoryMegaMenu, CATEGORY_MENUS } from '../CategoryMegaMenu/CategoryMegaMenu';
import styles from './CategoryNav.module.scss';

/** IDs that have a mega-menu dropdown */
const MENU_IDS = new Set(Object.keys(CATEGORY_MENUS));

export const CategoryNav: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const close = useCallback(() => {
    setOpenCategory(null);
    setMobileOpen(false);
  }, []);

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
        <button type="button" className={styles.mobileToggle} onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen}>
          <Menu size={17} /><span>Browse categories</span><ChevronDown size={16} />
        </button>
        <div className={`${styles.inner} ${mobileOpen ? styles.mobileOpen : ''}`}>
          {CATEGORIES.map((cat) => {
            const isOpen = cat.id === openCategory;
            const hasMenu = MENU_IDS.has(cat.id);
            return (
              <button
                key={cat.id}
                className={`${styles.navigationItem} ${isOpen ? styles.active : ''}`}
                onClick={() => {
                  if (isOpen) close();
                  else open(cat.id);
                }}
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
