'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from './QueryProvider';
import { useCartStore } from '@/store/useCartStore';

function CartHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <CartHydration />
        {children}
      </QueryProvider>
    </AuthProvider>
  );
}
