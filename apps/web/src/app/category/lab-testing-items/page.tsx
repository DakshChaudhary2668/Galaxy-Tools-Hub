'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Zap, ChevronRight, ArrowRight, Headphones } from 'lucide-react';
import { AnnouncementBar } from '../../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../../components/Header/Header';
import { CategoryNav } from '../../../components/CategoryNav/CategoryNav';
import { Footer } from '../../../components/Footer/Footer';
import { CartDrawer } from '../../../components/CartDrawer/CartDrawer';
import styles from './CategoryView.module.scss';

const SIDEBAR_CATEGORIES = [
  { id: 'multimeter', name: 'Multimeter', active: true },
  { id: 'insulation', name: 'Insulation Tester' },
  { id: 'thermal', name: 'Thermal Imager' },
  { id: 'infrared', name: 'Infrared Thermometer' },
  { id: 'clampmeter', name: 'Clampmeter' },
  { id: 'calibrators', name: 'Calibrators' },
  { id: 'battery', name: 'Battery Tester' },
  { id: 'coating', name: 'Coating Thickness Gauge' },
  { id: 'sound', name: 'Sound Level Meter' },
  { id: 'oscilloscope', name: 'Oscilloscope/DSO' },
  { id: 'function', name: 'Function Generator' },
  { id: 'frequency', name: 'Frequency Counter' },
  { id: 'all', name: 'All Lab Testing Items' },
];

const SUBCATEGORY_ITEMS = [
  {
    id: 'gt91',
    name: 'Multimeter',
    count: '24 Items',
    priceRange: '₹1,200 – ₹15,500',
    image: '/images/cat-multimeter.jpg',
    targetProduct: '/product/gt91',
  },
  {
    id: 'gt-95xx-pro',
    name: 'Insulation Tester',
    count: '18 Items',
    priceRange: '₹3,500 – ₹45,000',
    image: '/images/cat-insulation.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'thermal',
    name: 'Thermal Imager',
    count: '12 Items',
    priceRange: '₹22,000 – ₹2,45,000',
    image: '/images/cat-thermal.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'infrared',
    name: 'Infrared Thermometer',
    count: '21 Items',
    priceRange: '₹950 – ₹6,500',
    image: '/images/cat-infrared.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'clampmeter',
    name: 'Clampmeter',
    count: '16 Items',
    priceRange: '₹1,800 – ₹18,000',
    image: '/images/cat-clampmeter.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'calibrators',
    name: 'Calibrators',
    count: '15 Items',
    priceRange: '₹4,500 – ₹65,000',
    image: '/images/cat-calibrators.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'battery',
    name: 'Battery Tester',
    count: '10 Items',
    priceRange: '₹2,000 – ₹12,000',
    image: '/images/cat-battery.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'ctg999',
    name: 'Coating Thickness Gauge',
    count: '14 Items',
    priceRange: '₹6,500 – ₹38,000',
    image: '/images/cat-coating.jpg',
    targetProduct: '/product/ctg999',
  },
  {
    id: 'sound',
    name: 'Sound Level Meter',
    count: '11 Items',
    priceRange: '₹3,200 – ₹22,000',
    image: '/images/cat-sound.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'oscilloscope',
    name: 'Oscilloscope/DSO',
    count: '09 Items',
    priceRange: '₹18,000 – ₹1,20,000',
    image: '/images/cat-oscilloscope.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'function',
    name: 'Function Generator',
    count: '07 Items',
    priceRange: '₹9,500 – ₹85,000',
    image: '/images/cat-function.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
  {
    id: 'frequency',
    name: 'Frequency Counter',
    count: '06 Items',
    priceRange: '₹6,000 – ₹55,000',
    image: '/images/cat-frequency.jpg',
    targetProduct: '/product/gt-95xx-pro',
  },
];

export default function CategoryPage() {
  const [activeSidebar, setActiveSidebar] = useState('multimeter');
  const router = useRouter();

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>›</span>
          <strong>Lab Testing Items</strong>
        </div>

        {/* Category Header Banner */}
        <div className={styles.categoryHeader}>
          <div className={styles.titleGroup}>
            <h1>LAB TESTING ITEMS</h1>
            <p>Precision instruments for accurate lab testing, analysis & measurement.</p>
          </div>
          <div className={styles.trustedBadge}>
            <Zap className={styles.badgeIcon} />
            <span>Trusted by 1000+ Industries</span>
          </div>
        </div>

        {/* Layout with Sidebar & Content */}
        <div className={styles.contentLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarBox}>
              <div className={styles.sidebarTitle}>CATEGORIES</div>
              <div className={styles.sidebarList}>
                {SIDEBAR_CATEGORIES.map((cat) => {
                  const isActive = cat.id === activeSidebar;
                  return (
                    <button
                      key={cat.id}
                      className={`${styles.sidebarItem} ${isActive ? styles.active : ''}`}
                      onClick={() => setActiveSidebar(cat.id)}
                    >
                      <span>{cat.name}</span>
                      {isActive ? <ArrowRight size={14} /> : <ChevronRight size={14} color="#999999" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Need Help Box */}
            <div className={styles.helpBox}>
              <div className={styles.helpIcon}>
                <Headphones size={20} />
              </div>
              <div className={styles.helpText}>
                <h4>Need Help?</h4>
                <p>Talk to our expert<br /><strong>+91 98765 43210</strong></p>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <section className={styles.mainContent}>
            <div className={styles.topControlRow}>
              <div className={styles.countText}>Showing 1–12 of 24 categories</div>
              <select className={styles.sortSelect} defaultValue="popular">
                <option value="popular">Sort by: Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>

            <div className={styles.subCatGrid}>
              {SUBCATEGORY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={styles.subCatCard}
                  onClick={() => router.push(item.targetProduct)}
                >
                  <div className={styles.cardImgArea}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={160}
                      height={120}
                      className={styles.cardImg}
                    />
                  </div>
                  <h3 className={styles.cardTitle}>{item.name}</h3>
                  <span className={styles.itemCount}>{item.count}</span>
                  <span className={styles.priceRange}>{item.priceRange}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
