import type { Metadata } from 'next';
import { Providers } from '@/components/providers/Providers';
import './globals.scss';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://galaxytoolshub.com'),
  title: 'Galaxy Tools Hub — Professional Grade Testing & Soldering Instruments',
  description:
    'Equip your workforce with precision-engineered tools designed for rugged industrial environments and exacting specifications.',
  keywords: 'multimeters, testing equipment, industrial tools, galaxy tools hub, MECO, HTC',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://galaxytoolshub.com',
    siteName: 'Galaxy Tools Hub',
    title: 'Galaxy Tools Hub — Professional Grade Testing & Soldering Instruments',
    description: 'Professional testing, measurement and soldering instruments for industrial and technical users.',
    images: [{ url: '/images/logo.png', alt: 'Galaxy Tools Hub' }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
