'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.scss';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('Searching for:', query);
    }
  };

  return (
    <form className={styles.searchWrapper} onSubmit={handleSubmit} role="search">
      <Search className={styles.searchIcon} />
      <input
        type="text"
        className={styles.inputField}
        placeholder="Search SKU or Product Name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search SKU or Product Name"
      />
    </form>
  );
};
