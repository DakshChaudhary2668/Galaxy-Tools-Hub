'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, UserRound, ChevronRight, Send } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './ContactPage.module.scss';
import { submitEnquiry } from '@/services/enquiry.service';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await submitEnquiry({
        type: 'contact',
        name: String(form.get('name') || ''),
        company: String(form.get('company') || ''),
        email: String(form.get('email') || ''),
        phone: String(form.get('phone') || ''),
        subject: String(form.get('subject') || ''),
        message: String(form.get('message') || ''),
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
          <span aria-current="page">Contact Technical Sales</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>Contact B2B Sales & Procurement Desk</h1>
          <p>Request quotations and product or dispatch assistance from our sales desk.</p>
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
                  <p><a href="tel:+919015133267">+91 90151 33267</a> / <a href="tel:+911143603957">011-43603957</a></p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Mail size={20} color="#111827" />
                <div>
                  <strong>Sales Email</strong>
                  <p><a href="mailto:galaxyinstruments9@gmail.com">galaxyinstruments9@gmail.com</a></p>
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
              <form onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Your full name" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Company / Institution *</label>
                    <input name="company" type="text" required maxLength={150} autoComplete="organization" placeholder="Organization name" />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Official Email *</label>
                    <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="name@company.com" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="Your phone number" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Subject / Instrument Requirement *</label>
                  <input name="subject" type="text" required maxLength={200} placeholder="Product or quotation requirement" />
                </div>

                <div className={styles.formGroup}>
                  <label>Message / Specifications *</label>
                  <textarea name="message" rows={4} required maxLength={5000} placeholder="Include the models, quantities or assistance you need."></textarea>
                </div>

                <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />

                <button type="submit" className={styles.submitBtn} disabled={status === 'sending'}>
                  <Send size={14} />
                  <span>{status === 'sending' ? 'Sending…' : 'Submit Technical Inquiry'}</span>
                </button>
                {status === 'sent' && <p role="status">Your enquiry has been sent successfully.</p>}
                {status === 'error' && <p role="alert">We could not send your enquiry. Please use the phone or email shown on this page.</p>}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
