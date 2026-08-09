import type { Metadata } from 'next';
import { Roboto, Noto_Sans_Mono } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import '@/styles/_tokens.scss';
import './globals.scss';

// Prevent static prerendering — Clerk requires a valid key at build time.
// Remove this when a real NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is configured.
export const dynamic = 'force-dynamic';


const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const notoSansMono = Noto_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Galaxy Tools Hub | Industrial B2B Equipment',
  description:
    'Professional-grade testing, measuring, and soldering instruments for industrial procurement.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} ${notoSansMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
