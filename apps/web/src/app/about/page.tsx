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
          <p>Premier Authorized Industrial Calibration, Testing Equipment & Tooling Distributor.</p>
        </header>

        <section className={styles.contentSection}>
          <div className={styles.prose}>
            <h2>Engineering Precision & Industrial Reliability</h2>
            <p>
              Founded to serve electrical contractors, power generation plants, aerospace research labs, and manufacturing facilities across India, <strong>Galaxy Tools Hub</strong> is an authorized procurement distributor for world-leading testing and measurement brands including Fluke, UNI-T, MECO, Kyoritsu, HTC Instruments, and G-Tech Industrial.
            </p>
            <p>
              Every instrument dispatched from our central New Delhi logistics warehouse undergoes serial number inspection, battery health verification, and factory calibration checks.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <Award size={24} color="#111827" />
              <h3>100% OEM Direct Guarantee</h3>
              <p>Direct manufacturer sourcing with genuine serial numbers and authorized Indian warranties.</p>
            </div>
            <div className={styles.valueCard}>
              <Wrench size={24} color="#111827" />
              <h3>NABL 17025 Calibration</h3>
              <p>Optional accredited traceable calibration certificates available on all precision instruments.</p>
            </div>
            <div className={styles.valueCard}>
              <Building size={24} color="#111827" />
              <h3>B2B GST & Corporate Billing</h3>
              <p>Itemized tax invoices with full 18% Input Tax Credit (ITC) compliance for enterprises.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
