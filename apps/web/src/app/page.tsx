import React from 'react';
import { AnnouncementBar } from '../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { CategoryNav } from '../components/CategoryNav/CategoryNav';
import { Hero } from '../components/Hero/Hero';
import { TrustStrip } from '../components/TrustStrip/TrustStrip';
import { ProductSection } from '../components/ProductSection/ProductSection';
import { TopCategories } from '../components/TopCategories/TopCategories';
import { LatestBlogs } from '../components/LatestBlogs/LatestBlogs';
import { BrandsStrip } from '../components/BrandsStrip/BrandsStrip';
import { Footer } from '../components/Footer/Footer';
import { CartDrawer } from '../components/CartDrawer/CartDrawer';

import { FEATURED_PRODUCTS } from '../data/products';
import { TRENDING_PRODUCTS, DISCOUNTED_PRODUCTS } from '../data/homepageSeed';

export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />
      <Hero />
      <TrustStrip />
      <ProductSection title="FEATURED INSTRUMENTS" products={FEATURED_PRODUCTS} viewAllHref="/products" />
      <ProductSection title="TRENDING PRODUCTS" products={TRENDING_PRODUCTS} viewAllHref="/products" />
      <ProductSection title="DISCOUNTED PRODUCTS" products={DISCOUNTED_PRODUCTS} viewAllHref="/products" />
      <TopCategories />
      <LatestBlogs />
      <BrandsStrip />
      <Footer />
      <CartDrawer />
    </main>
  );
}
