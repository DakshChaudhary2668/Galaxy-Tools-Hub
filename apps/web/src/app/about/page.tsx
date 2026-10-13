import React from 'react';
import Link from 'next/link';
import { Award, Wrench, Building, ChevronRight } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './InfoPage.module.scss';

export default function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span aria-current="page">About Galaxy Tools Hub</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>About Galaxy Tools Hub India</h1>
          <p>Testing, measurement, soldering and industrial tool supplier.</p>
        </header>

        <section className={styles.contentSection}>
          <div className={styles.prose}>
            <h2>Engineering Precision & Industrial Reliability</h2>
            <p>
              <strong>Galaxy Tools Hub</strong> supplies testing, measurement, soldering and industrial tools through its online catalogue and Delhi sales office.
            </p>
            <p>
              Product availability, warranty coverage and calibration requirements are confirmed for each order.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <Award size={24} color="#111827" />
              <h3>Product Catalogue</h3>
              <p>Browse instruments by product, category and brand.</p>
            </div>
            <div className={styles.valueCard}>
              <Wrench size={24} color="#111827" />
              <h3>Requirement Support</h3>
              <p>Ask the sales desk about model selection and calibration requirements.</p>
            </div>
            <div className={styles.valueCard}>
              <Building size={24} color="#111827" />
              <h3>Clear Checkout</h3>
              <p>Base price, GST and weight-based freight are shown separately.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
