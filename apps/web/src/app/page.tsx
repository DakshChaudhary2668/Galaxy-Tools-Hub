export const dynamic = 'force-dynamic';

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
import { getProducts } from '../services/product.service';

export default async function HomePage() {
  const [featuredRes, discountedRes, trendingRes] = await Promise.all([
    getProducts({ active: 'true', homepage: 'true', featured: 'true', limit: '5' }),
    getProducts({ active: 'true', homepage: 'true', discounted: 'true', limit: '5' }),
    getProducts({ active: 'true', homepage: 'true', sort: 'latest', limit: '5' }),
  ]);

  const featured = featuredRes?.data || [];
  const discounted = discountedRes?.data || [];
  const trending = trendingRes?.data || [];

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />
      <Hero />
      <TrustStrip />
      <ProductSection title="FEATURED INSTRUMENTS" products={featured} viewAllHref="/products" />
      <ProductSection title="TRENDING PRODUCTS" products={trending} viewAllHref="/products" />
      <ProductSection title="DISCOUNTED PRODUCTS" products={discounted} viewAllHref="/products" />
      <TopCategories />
      <LatestBlogs />
      <BrandsStrip />
      <Footer />
      <CartDrawer />
    </main>
  );
}
