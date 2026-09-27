import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from '../about/InfoPage.module.scss';

export default function GstCompliancePage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span aria-current="page">GST & B2B Tax Invoicing</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>B2B GST Billing & Input Tax Credit (ITC) Guidelines</h1>
          <p>Official tax invoicing compliance for corporate procurement, defense contractors, and institutions.</p>
        </header>

        <section className={styles.contentSection}>
          <div className={styles.prose}>
            <h2>100% Tax Invoicing with Full ITC Eligibility</h2>
            <p>
              Every transaction made through <strong>Galaxy Tools Hub</strong> generates a legally compliant Indian Goods and Services Tax (GST) commercial invoice. All testing, measurement, and calibration instruments sold on our portal are classified under standardized Harmonized System of Nomenclature (HSN) codes (primarily <strong>HSN 9030</strong> for electrical measurement apparatus).
            </p>
            <p>
              Corporate buyers who provide their 15-digit GSTIN during checkout will have their GST tax invoices auto-filed to the GSTN portal for seamless monthly GSTR-2B Input Tax Credit (ITC) reconciliation.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <FileText size={24} color="#111827" />
              <h3>HSN Code Classification</h3>
              <p>Instruments are categorized under HSN 9030 (18% GST rate) with itemized CGST + SGST or IGST breakdowns.</p>
            </div>
            <div className={styles.valueCard}>
              <CheckCircle2 size={24} color="#059669" />
              <h3>Direct GSTR-1 Auto-Filing</h3>
              <p>B2B invoices are uploaded to the GST portal on the 10th of every month for instant tax credit reflection.</p>
            </div>
            <div className={styles.valueCard}>
              <ShieldCheck size={24} color="#111827" />
              <h3>E-Way Bill Generation</h3>
              <p>Compliant E-Way bills generated for all consignments exceeding ₹50,000 value across state borders.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
