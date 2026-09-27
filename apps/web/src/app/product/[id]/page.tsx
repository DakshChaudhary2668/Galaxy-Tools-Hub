import { Metadata } from 'next';
import { getProductById } from '@/services/product.service';
import ProductDetailClient from './ProductDetailClient';
import { AnnouncementBar } from '@/components/AnnouncementBar/AnnouncementBar';
import { Header } from '@/components/Header/Header';
import { CategoryNav } from '@/components/CategoryNav/CategoryNav';
import { Footer } from '@/components/Footer/Footer';
import { CartDrawer } from '@/components/CartDrawer/CartDrawer';
import styles from './ProductDetail.module.scss';

// Type params as a Promise for Next.js 15 compatibility
type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductById(resolvedParams.id);

  if (!product) {
    return { title: 'Product Not Found - Galaxy Tools Hub' };
  }

  return {
    title: `${product.seo_title || product.name} - Galaxy Tools Hub`,
    description: product.seo_description || product.short_description || product.description || undefined,
    keywords: product.meta_keywords || product.name,
    alternates: {
      canonical: `/product/${product.id}`,
    },
    openGraph: {
      title: product.name,
      description: product.seo_description || product.short_description || undefined,
      images: (product as any).image_url ? [(product as any).image_url] : [],
    }
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />
      <ProductDetailClient id={resolvedParams.id} />
      <Footer />
      <CartDrawer />
    </div>
  );
}
