'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Briefcase, TrendingUp, ChevronRight, Check } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './DealerPage.module.scss';
import { submitEnquiry } from '@/services/enquiry.service';

export default function DealerProgramPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitEnquiry({
        type: 'dealer',
        name: String(form.get('name') || ''),
        company: String(form.get('company') || ''),
        email: String(form.get('email') || ''),
        phone: String(form.get('phone') || ''),
        subject: 'Dealer application',
        message: `GSTIN: ${String(form.get('gstin') || '')}\nOperating region: ${String(form.get('region') || '')}`,
        website: String(form.get('website') || '')
      });
      formElement.reset();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

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
          <p>Send your business details for dealer and reseller programme review.</p>
        </header>

        <div className={styles.contentGrid}>
          <div className={styles.benefitCol}>
            <h2>Why Partner with Galaxy Tools Hub?</h2>
            <div className={styles.benefitList}>
              <div className={styles.benefitItem}>
                <Award size={20} color="#111827" />
                <div>
                  <strong>Commercial Review</strong>
                  <p>Commercial terms are shared after the business application is reviewed.</p>
                </div>
              </div>

              <div className={styles.benefitItem}>
                <Briefcase size={20} color="#111827" />
                <div>
                  <strong>Verified Business Accounts</strong>
                  <p>Applications are assessed using the submitted business and GST information.</p>
                </div>
              </div>

              <div className={styles.benefitItem}>
                <TrendingUp size={20} color="#111827" />
                <div>
                  <strong>Project Enquiries</strong>
                  <p>Product availability and quotation support are confirmed for each enquiry.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <h3>Apply for Authorized Dealership</h3>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Business / Distributorship Legal Name *</label>
                  <input name="company" type="text" required maxLength={150} autoComplete="organization" placeholder="Registered business name" />
                </div>
                <div className={styles.formGroup}>
                  <label>GSTIN (Mandatory for Wholesale Accounts) *</label>
                  <input name="gstin" type="text" required minLength={15} maxLength={15} placeholder="15-digit GSTIN" />
                </div>
                <div className={styles.formGroup}>
                  <label>Authorized Signatory Name *</label>
                  <input name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Proprietor / managing partner" />
                </div>
                <div className={styles.formGroup}>
                  <label>Official Business Email *</label>
                  <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="dealer@domain.com" />
                </div>
                <div className={styles.formGroup}>
                  <label>Official Phone Number *</label>
                  <input name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="Business phone number" />
                </div>
                <div className={styles.formGroup}>
                  <label>Operating State / Region *</label>
                  <input name="region" type="text" required maxLength={150} placeholder="Operating state or region" />
                </div>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
                <button type="submit" className={styles.applyBtn} disabled={status === 'sending'}>
                  <Check size={14} />
                  <span>{status === 'sending' ? 'Sending…' : 'Submit Dealership Application'}</span>
                </button>
                {status === 'sent' && <p role="status">Your dealer application has been sent successfully.</p>}
                {status === 'error' && <p role="alert">We could not send the application. Please contact the sales desk directly.</p>}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
