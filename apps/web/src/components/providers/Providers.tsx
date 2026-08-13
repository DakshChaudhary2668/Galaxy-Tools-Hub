'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from './QueryProvider';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function Providers({ children }: { children: React.ReactNode }) {
  if (!publishableKey) {
    return <QueryProvider>{children}</QueryProvider>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryProvider>{children}</QueryProvider>
    </ClerkProvider>
  );
}
