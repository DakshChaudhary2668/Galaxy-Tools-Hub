'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Bell, ShoppingCart } from 'lucide-react';
import { SearchBar } from '../SearchBar/SearchBar';
import { useCartStore } from '../../store/useCartStore';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const { getTotalItems, toggleDrawer } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink} aria-label="Galaxy Tools Hub Homepage">
          <Image
            src="/images/logo.png"
            alt="Galaxy Tools Hub Logo"
            width={140}
            height={32}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Search Bar Center Slot */}
        <div className={styles.searchContainer}>
          <SearchBar />
        </div>

        {/* User / Notification / Cart Icons */}
        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Account Settings">
            <User className={styles.icon} />
          </button>
          <button className={styles.iconBtn} aria-label="Notifications">
            <Bell className={styles.icon} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => toggleDrawer(true)}
            aria-label={`Shopping Quote Cart with ${totalItems} items`}
          >
            <ShoppingCart className={styles.icon} />
            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
          </button>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className={styles.mobileSearchRow}>
        <SearchBar />
      </div>
    </header>
  );
};
