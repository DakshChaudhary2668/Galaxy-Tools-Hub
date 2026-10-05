'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User as UserIcon, Bell, ShoppingCart, LogOut, ShieldCheck } from 'lucide-react';
import { SearchBar } from '../SearchBar/SearchBar';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const { getTotalItems, toggleDrawer } = useCartStore();
  const { isAuthenticated, profile, adminUser, isAdmin, signOut } = useAuth();
  const totalItems = getTotalItems();

  const userDisplayName = (profile && ('full_name' in profile ? profile.full_name : profile.fullName)) || adminUser?.name || 'Account';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink} aria-label="Galaxy Tools Hub Homepage">
          <Image
            src="/images/logo.png"
            alt="Galaxy Tools Hub Logo"
            width={230}
            height={64}
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
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className={styles.iconBtn}
                  title="Admin Dashboard"
                  aria-label="Admin Dashboard"
                  style={{ color: '#F5C710' }}
                >
                  <ShieldCheck className={styles.icon} />
                </Link>
              )}
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#E2E8F0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userDisplayName}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className={styles.iconBtn}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className={styles.icon} size={16} />
              </button>
            </div>
          ) : (
            <Link href="/sign-in" className={styles.iconBtn} title="Sign In" aria-label="Sign In">
              <UserIcon className={styles.icon} />
            </Link>
          )}

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
