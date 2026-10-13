import React from 'react';
import Link from 'next/link';
import { Info, ChevronRight } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './TrackPage.module.scss';

export default function TrackOrderPage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span aria-current="page">B2B Consignment Tracking</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>Consignment & Order Tracking</h1>
          <p>Get shipment updates from the sales desk once your order has been dispatched.</p>
        </header>

        <div className={styles.statusResultCard}>
          <div className={styles.resultHeader}>
            <div>
              <h2>Online tracking is not available yet</h2>
              <p>We will share the carrier and tracking number when your order is dispatched.</p>
            </div>
            <Info size={24} aria-hidden="true" />
          </div>
          <p>For an order update, call <a href="tel:+919015133267">+91 90151 33267</a> or email <a href="mailto:galaxyinstruments9@gmail.com">galaxyinstruments9@gmail.com</a>.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
