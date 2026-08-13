import React from 'react';
import { AnnouncementBar } from '../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../components/Header/Header';
import { CategoryNav } from '../components/CategoryNav/CategoryNav';
import { Hero } from '../components/Hero/Hero';
import { TrustStrip } from '../components/TrustStrip/TrustStrip';
import { FeaturedProducts } from '../components/FeaturedProducts/FeaturedProducts';
import { Footer } from '../components/Footer/Footer';
import { CartDrawer } from '../components/CartDrawer/CartDrawer';

export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />
      <Hero />
      <TrustStrip />
      <FeaturedProducts />
      <Footer />
      <CartDrawer />
    </main>
  );
}
