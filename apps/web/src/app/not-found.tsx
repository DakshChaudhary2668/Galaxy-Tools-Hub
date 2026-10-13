import Link from 'next/link';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { Header } from '@/components/Header/Header';
import { CategoryNav } from '@/components/CategoryNav/CategoryNav';
import { Footer } from '@/components/Footer/Footer';

export default function NotFound() {
  return <><AnnouncementBar /><Header /><CategoryNav /><main style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}><h1>Page not found</h1><p style={{ margin: '16px 0 28px', color: '#667085' }}>The page may have moved or the address may be incorrect.</p><Link href="/products" style={{ background: '#111', color: '#fff', padding: '12px 20px', textDecoration: 'none', fontWeight: 700 }}>Browse products</Link></main><Footer /></>;
}
