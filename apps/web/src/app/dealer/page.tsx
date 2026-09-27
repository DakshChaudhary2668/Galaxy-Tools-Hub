import React from 'react';
import Link from 'next/link';
import { Award, Briefcase, TrendingUp, ChevronRight, Check } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './DealerPage.module.scss';

export default function DealerProgramPage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span aria-current="page">Authorized Dealer / Reseller Network</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>Authorized Dealer & Reseller Wholesale Program</h1>
          <p>Join India&apos;s leading B2B distributor network for wholesale margins on Fluke, MECO, HTC & G-Tech.</p>
        </header>

        <div className={styles.contentGrid}>
          <div className={styles.benefitCol}>
            <h2>Why Partner with Galaxy Tools Hub?</h2>
            <div className={styles.benefitList}>
              <div className={styles.benefitItem}>
                <Award size={20} color="#111827" />
                <div>
                  <strong>Exclusive Wholesale Margins</strong>
                  <p>Up to 35% margin on catalog prices with tiered volume rebates for authorized regional dealers.</p>
                </div>
              </div>

              <div className={styles.benefitItem}>
                <Briefcase size={20} color="#111827" />
                <div>
                  <strong>Dedicated Credit Lines (Net 30/60)</strong>
                  <p>Flexible commercial credit terms available for verified electrical contractors and distributors.</p>
                </div>
              </div>

              <div className={styles.benefitItem}>
                <TrendingUp size={20} color="#111827" />
                <div>
                  <strong>Tender & Project Price Protection</strong>
                  <p>Special project support and OEM price locks for institutional government tender submissions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <h3>Apply for Authorized Dealership</h3>
              <form onSubmit={(e) => { e.preventDefault(); alert('Dealership application received! Our dealer channel manager will contact you.'); }}>
                <div className={styles.formGroup}>
                  <label>Business / Distributorship Legal Name *</label>
                  <input type="text" required placeholder="e.g. Modern Electricals & Instruments" />
                </div>
                <div className={styles.formGroup}>
                  <label>GSTIN (Mandatory for Wholesale Accounts) *</label>
                  <input type="text" required maxLength={15} placeholder="15-digit GSTIN" />
                </div>
                <div className={styles.formGroup}>
                  <label>Authorized Signatory Name *</label>
                  <input type="text" required placeholder="Proprietor / Managing Partner" />
                </div>
                <div className={styles.formGroup}>
                  <label>Official Business Email *</label>
                  <input type="email" required placeholder="dealer@domain.com" />
                </div>
                <div className={styles.formGroup}>
                  <label>Operating State / Region *</label>
                  <input type="text" required placeholder="e.g. Gujarat & Maharashtra" />
                </div>
                <button type="submit" className={styles.applyBtn}>
                  <Check size={14} />
                  <span>Submit Dealership Application</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
