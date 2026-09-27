'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.scss';

export const SearchBar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [query, setQuery] = useState(search);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = query.trim().replace(/\s+/g, ' ');
    const params = pathname === '/products'
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();

    if (normalized) params.set('search', normalized);
    else params.delete('search');
    params.delete('page');

    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ''}`);
  };

  return (
    <form className={styles.searchWrapper} onSubmit={handleSubmit} role="search">
      <input
        type="text"
        className={styles.inputField}
        placeholder="Search SKU or Product Name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
        aria-label="Search SKU or Product Name"
      />
      <button type="submit" className={styles.submitButton} aria-label="Search products">
        <Search className={styles.searchIcon} />
      </button>
    </form>
  );
};
