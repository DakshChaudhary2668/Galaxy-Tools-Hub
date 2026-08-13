import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.scss';

// Prevent static prerendering — Clerk requires a valid key at build time.
// Remove this when a real NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is configured.
export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Galaxy Tools Hub — Professional Grade Testing & Soldering Instruments',
  description:
    'Equip your workforce with precision-engineered tools designed for rugged industrial environments and exacting specifications.',
  keywords: 'multimeters, testing equipment, industrial tools, galaxy tools hub, MECO, HTC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
