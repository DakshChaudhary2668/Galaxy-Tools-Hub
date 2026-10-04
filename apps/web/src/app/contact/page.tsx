'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, UserRound, ChevronRight, Send } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './ContactPage.module.scss';

export default function ContactPage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span aria-current="page">Contact Technical Sales</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>Contact B2B Sales & Procurement Desk</h1>
          <p>Get instant quotations, calibration consultation, and logistics dispatch support.</p>
        </header>

        <div className={styles.contactGrid}>
          <div className={styles.infoCol}>
            <div className={styles.infoCard}>
              <div className={styles.infoItem}>
                <MapPin size={20} color="#111827" />
                <div>
                  <strong>Sales Office</strong>
                  <p>1674/4, Ground Floor, Bhagirath Palace, Delhi 110006</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Phone size={20} color="#111827" />
                <div>
                  <strong>Contact Numbers</strong>
                  <p>+91 90151 33267 / 011-43603957</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Mail size={20} color="#111827" />
                <div>
                  <strong>Sales Email</strong>
                  <p>galaxyinstruments9@gmail.com</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <UserRound size={20} color="#111827" />
                <div>
                  <strong>Sales Contact</strong>
                  <p>Nitin Verma</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCol}>
            <div className={styles.formCard}>
              <h2>Send Direct Inquiry / Tender Request</h2>
              <form onSubmit={(e) => { e.preventDefault(); alert('Inquiry submitted! Our technical desk will contact you within 2 business hours.'); }}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input type="text" required placeholder="e.g. Vikram Singhania" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Company / Institution *</label>
                    <input type="text" required placeholder="Organization Name" />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Official Email *</label>
                    <input type="email" required placeholder="name@company.com" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input type="tel" required placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Subject / Instrument Requirement *</label>
                  <input type="text" required placeholder="e.g. Quotation for 10x Fluke 117 Multimeters + NABL Certs" />
                </div>

                <div className={styles.formGroup}>
                  <label>Message / Specifications *</label>
                  <textarea rows={4} required placeholder="Detail specific testing ranges, calibration requirements, or delivery site..."></textarea>
                </div>

                <button type="submit" className={styles.submitBtn}>
                  <Send size={14} />
                  <span>Submit Technical Inquiry</span>
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
