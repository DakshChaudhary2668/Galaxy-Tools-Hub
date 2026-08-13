'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './Hero.module.scss';

export const Hero: React.FC = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          {/* Left Content Card */}
          <div className={styles.leftCard}>
            <span className={styles.industrialBadge}>INDUSTRIAL GRADE</span>
            <h1 className={styles.mainHeading}>
              PROFESSIONAL<br />
              GRADE TESTING &<br />
              SOLDERING<br />
              INSTRUMENTS
            </h1>
            <p className={styles.description}>
              Equip your workforce with precision-engineered tools designed for rugged industrial environments and exacting specifications.
            </p>
            <div className={styles.buttonGroup}>
              <button className={styles.btnPrimary}>
                <span>EXPLORE CATALOG</span>
                <ArrowRight size={14} />
              </button>
              <button className={styles.btnSecondary}>
                REQUEST QUOTE
              </button>
            </div>
          </div>

          {/* Center Promo Card: MECO Precision */}
          <div
            className={styles.promoCard}
            style={{ backgroundImage: `url('/images/hero-meco.jpg')` }}
          >
            <div className={styles.promoContent}>
              <h2 className={styles.promoTitle}>MECO Precision</h2>
              <p className={styles.promoSubtitle}>CAT III 600V | TRUE RMS</p>
            </div>
          </div>

          {/* Right Promo Card: HTC Diagnostics */}
          <div
            className={styles.promoCard}
            style={{ backgroundImage: `url('/images/hero-htc.jpg')` }}
          >
            <div className={styles.promoContent}>
              <h2 className={styles.promoTitle}>HTC Diagnostics</h2>
              <p className={styles.promoSubtitle}>HEAVY DUTY | NCV</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
