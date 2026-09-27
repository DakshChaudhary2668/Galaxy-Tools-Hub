import React from 'react';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from '../about/InfoPage.module.scss';

export default function RefundPolicyPage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span aria-current="page">Industrial Warranty & Replacement Policy</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>Warranty, Replacement & Returns Policy</h1>
          <p>Transparent B2B industrial terms for testing instruments, calibration seals, and DOA replacements.</p>
        </header>

        <section className={styles.contentSection}>
          <div className={styles.prose}>
            <h2>7-Day Dead-on-Arrival (DOA) & Transit Replacement</h2>
            <p>
              In the event that an instrument arrives physically damaged during transit or exhibits a Dead-on-Arrival (DOA) defect upon initial bench testing, Galaxy Tools Hub provides a <strong>free, immediate 7-day pickup and replacement</strong>.
            </p>
            <p>
              All standard testing instruments are covered by a minimum <strong>1-Year Manufacturer Warranty</strong> backed directly by authorized service centers across Mumbai, Delhi, Bengaluru, and Chennai.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <RefreshCw size={24} color="#111827" />
              <h3>7-Day Hassle-Free Replacement</h3>
              <p>Direct courier reverse pickup for transit-damaged or non-functioning devices.</p>
            </div>
            <div className={styles.valueCard}>
              <ShieldCheck size={24} color="#059669" />
              <h3>1-Year OEM Warranty</h3>
              <p>Official warranty cards enclosed with repair coverage for internal electronic failure.</p>
            </div>
            <div className={styles.valueCard}>
              <AlertCircle size={24} color="#111827" />
              <h3>Calibration Seal Integrity</h3>
              <p>Custom-calibrated NABL certificates are generated specific to instrument serial numbers.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
