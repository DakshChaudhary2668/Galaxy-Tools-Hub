'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Truck, CheckCircle2, ChevronRight } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import styles from './TrackPage.module.scss';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [searched, setSearched] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) setSearched(true);
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
          <span aria-current="page">B2B Consignment Tracking</span>
        </nav>

        <header className={styles.pageHeader}>
          <h1>Consignment & Order Tracking</h1>
          <p>Real-time transit telemetry for industrial instruments and calibration dispatches.</p>
        </header>

        <div className={styles.searchCard}>
          <form onSubmit={handleTrack} className={styles.searchForm}>
            <input
              type="text"
              required
              placeholder="Enter Order Reference (e.g. GTH-984210) or AWB Tracking No."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <button type="submit" className={styles.trackBtn}>
              <Search size={15} />
              <span>Track Consignment</span>
            </button>
          </form>
        </div>

        {searched && (
          <div className={styles.statusResultCard}>
            <div className={styles.resultHeader}>
              <div>
                <h2>Consignment #{orderId.toUpperCase()}</h2>
                <p>Carrier: Blue Dart Industrial Surface / Delhivery Express Cargo</p>
              </div>
              <span className={styles.activeTag}>IN TRANSIT</span>
            </div>

            <div className={styles.timeline}>
              <div className={`${styles.timelineStep} ${styles.completed}`}>
                <div className={styles.stepDot}><CheckCircle2 size={14} color="#FFF" /></div>
                <div className={styles.stepContent}>
                  <strong>Quality & Calibration Check Completed</strong>
                  <p>19 Aug 2026, 11:30 AM • Central Depot, New Delhi</p>
                </div>
              </div>

              <div className={`${styles.timelineStep} ${styles.completed}`}>
                <div className={styles.stepDot}><CheckCircle2 size={14} color="#FFF" /></div>
                <div className={styles.stepContent}>
                  <strong>Cargo Dispatched with Shock-Absorbent Packaging</strong>
                  <p>19 Aug 2026, 03:45 PM • Out for Hub Connection</p>
                </div>
              </div>

              <div className={`${styles.timelineStep} ${styles.current}`}>
                <div className={styles.stepDot}><Truck size={14} color="#FFF" /></div>
                <div className={styles.stepContent}>
                  <strong>In Transit to Destination Hub</strong>
                  <p>Estimated Delivery: Tomorrow by 05:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
