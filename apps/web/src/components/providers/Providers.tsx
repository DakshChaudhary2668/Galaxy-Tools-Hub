'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from './QueryProvider';

function isValidClerkPublishableKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) return false;
  const parts = key.split('_');
  if (parts.length !== 3 || !parts[2]) return false;
  try {
    const decoded = atob(parts[2]);
    return decoded.endsWith('$') && decoded.includes('.');
  } catch {
    return false;
  }
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasValidKey = isValidClerkPublishableKey(publishableKey);

export function Providers({ children }: { children: React.ReactNode }) {
  if (!hasValidKey || !publishableKey) {
    return <QueryProvider>{children}</QueryProvider>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryProvider>{children}</QueryProvider>
    </ClerkProvider>
  );
}
