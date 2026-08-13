'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, ShoppingCart, Zap, Info, ShieldCheck, RefreshCw, Headphones, Play
} from 'lucide-react';
import { AnnouncementBar } from '../../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../../components/Header/Header';
import { CategoryNav } from '../../../components/CategoryNav/CategoryNav';
import { Footer } from '../../../components/Footer/Footer';
import { CartDrawer } from '../../../components/CartDrawer/CartDrawer';
import { useCartStore } from '../../../store/useCartStore';
import styles from './ProductDetail.module.scss';

export default function ProductDetailPage() {
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [selectedVoltage, setSelectedVoltage] = useState('250V/500V/1000V');
  const [selectedDiag, setSelectedDiag] = useState('PI/DAR');
  const { addToCart } = useCartStore();

  const productData = {
    id: 'gt-95xx-pro',
    name: 'Professional Digital Insulation Tester',
    category: 'Testing Equipment',
    price: 12450,
    currency: '₹',
    gstIncluded: true,
    status: 'IN_STOCK' as const,
    statusLabel: 'IN STOCK',
    image: '/images/pdp-main.jpg',
    technicalSpecs: 'CAT IV 600V | Up to 20GΩ | Li-ion',
  };

  const thumbs = [
    '/images/pdp-main.jpg',
    '/images/pdp-thumb1.jpg',
    '/images/pdp-thumb2.jpg',
    '/images/pdp-thumb3.jpg',
  ];

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
          <Link href="/category/lab-testing-items">Testing Equipment</Link>
          <span>›</span>
          <strong>Insulation Testers</strong>
        </div>

        <div className={styles.productLayout}>
          {/* Gallery Left */}
          <section className={styles.gallerySection}>
            <div className={styles.mainImageCard}>
              <span className={styles.stockTag}>IN STOCK</span>
              <Image
                src={thumbs[selectedThumb]}
                alt="Product main view"
                width={420}
                height={380}
                className={styles.mainImg}
                priority
              />
            </div>

            <div className={styles.thumbnailRow}>
              {thumbs.map((thumb, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumbCard} ${selectedThumb === idx ? styles.active : ''}`}
                  onClick={() => setSelectedThumb(idx)}
                >
                  <Image
                    src={thumb}
                    alt={`Thumbnail ${idx + 1}`}
                    width={70}
                    height={70}
                    className={styles.thumbImg}
                  />
                  {idx === 3 && (
                    <div className={styles.videoOverlay}>
                      <Play size={18} fill="#FFF" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Info Section Right */}
          <section className={styles.infoSection}>
            <div className={styles.brandSkuRow}>
              <div className={styles.brandText}>G-TECH</div>
              <span className={styles.skuBadge}>SKU: GT-95XX-PRO</span>
            </div>

            <h1 className={styles.productTitle}>
              Professional Digital Insulation Tester
            </h1>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
                <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
                <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
                <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
                <Star size={16} fill="#F59E0B" stroke="#F59E0B" />
              </div>
              <span className={styles.reviewText}>48 Technical Reviews</span>
            </div>

            <div className={styles.priceBlock}>
              <div className={styles.priceVal}>₹12,450</div>
              <div className={styles.gstSub}>INCL. GST & SHIPPING</div>
            </div>

            <div className={styles.divider} />

            {/* Test Voltage Range Selection */}
            <div className={styles.optionSection}>
              <span className={styles.optionLabel}>TEST VOLTAGE RANGE</span>
              <div className={styles.btnGroup}>
                {['250V/500V/1000V', '500V/1000V/2500V', 'Solar Special'].map((volt) => (
                  <button
                    key={volt}
                    className={`${styles.optBtn} ${selectedVoltage === volt ? styles.active : ''}`}
                    onClick={() => setSelectedVoltage(volt)}
                  >
                    {volt}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic Capability Selection */}
            <div className={styles.optionSection}>
              <span className={styles.optionLabel}>DIAGNOSTIC CAPABILITY</span>
              <div className={styles.btnGroup}>
                {['Standard', 'PI/DAR'].map((diag) => (
                  <button
                    key={diag}
                    className={`${styles.optBtn} ${selectedDiag === diag ? styles.active : ''}`}
                    onClick={() => setSelectedDiag(diag)}
                  >
                    <span>{diag === 'PI/DAR' ? 'PI/DAR + Rechargeable' : 'Standard'}</span>
                    {diag === 'PI/DAR' && <Info size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Specs Highlight Strip */}
            <div className={styles.specHighlightsStrip}>
              <div className={styles.specItem}>
                <Zap size={15} />
                <span>CAT IV 600V</span>
              </div>
              <div className={styles.specItem}>
                <span>📈 Up to 20GΩ</span>
              </div>
              <div className={styles.specItem}>
                <span>🔋 Li-ion</span>
              </div>
            </div>

            {/* CTAs */}
            <div className={styles.ctaStack}>
              <button
                className={styles.addToCartBtn}
                onClick={() => addToCart(productData)}
              >
                <ShoppingCart size={18} />
                <span>ADD TO CART</span>
              </button>

              <button
                className={styles.buyNowBtn}
                onClick={() => {
                  addToCart(productData);
                }}
              >
                <Zap size={18} />
                <span>BUY NOW</span>
              </button>

              <button className={styles.bulkQuoteBtn}>
                Request Bulk Quote
              </button>
            </div>

            {/* Guarantees Strip */}
            <div className={styles.guaranteesRow}>
              <div className={styles.guaranteeItem}>
                <ShieldCheck size={16} />
                <span>1 YR WARRANTY</span>
              </div>
              <div className={styles.guaranteeItem}>
                <RefreshCw size={16} />
                <span>7 DAY RETURN</span>
              </div>
              <div className={styles.guaranteeItem}>
                <Headphones size={16} />
                <span>24/7 SUPPORT</span>
              </div>
            </div>
          </section>
        </div>

        {/* Technical Specifications Table */}
        <section className={styles.specsTableSection}>
          <h2 className={styles.tableTitle}>Technical Specifications</h2>
          <table className={styles.specsTable}>
            <tbody>
              <tr>
                <th>Test Voltage</th>
                <td>250V / 500V / 1000V</td>
              </tr>
              <tr>
                <th>Insulation Resistance</th>
                <td>0.1MΩ to 20GΩ</td>
              </tr>
              <tr>
                <th>Short Circuit Current</th>
                <td>&lt; 1.8mA</td>
              </tr>
              <tr>
                <th>Advanced Diagnostics</th>
                <td>PI (Polarization Index), DAR (Dielectric Absorption Ratio)</td>
              </tr>
              <tr>
                <th>Safety Rating</th>
                <td>CAT IV 600V, CAT III 1000V</td>
              </tr>
              <tr>
                <th>Power Source</th>
                <td>Rechargeable Li-ion Battery (Included) or 6x AA</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
