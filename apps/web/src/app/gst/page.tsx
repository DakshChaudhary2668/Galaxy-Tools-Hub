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
          <p>How base prices and GST are displayed on the storefront.</p>
        </header>

        <section className={styles.contentSection}>
          <div className={styles.prose}>
            <h2>GST display and calculation</h2>
            <p>
              Product prices are displayed before GST. The checkout calculates GST separately using the product tax rate stored by the server.
            </p>
            <p>
              Seller legal identity, GSTIN and invoice-process details are awaiting final owner approval and must be confirmed before live payment acceptance.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <FileText size={24} color="#111827" />
              <h3>Product Tax Data</h3>
              <p>Each product record carries its applicable tax rate and HSN information where verified.</p>
            </div>
            <div className={styles.valueCard}>
              <CheckCircle2 size={24} color="#059669" />
              <h3>Invoice Configuration Pending</h3>
              <p>GSTIN and invoice identity must be approved before customer tax invoices are issued.</p>
            </div>
            <div className={styles.valueCard}>
              <ShieldCheck size={24} color="#111827" />
              <h3>Contact the Sales Desk</h3>
              <p>Confirm any tax-document or e-way-bill requirement before ordering.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
