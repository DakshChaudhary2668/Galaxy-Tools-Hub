import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.scss';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandCol}>
          <div className={styles.brandTitle}>GALAXY TOOLS HUB</div>
          <p className={styles.copyright}>
            © 2024 Galaxy Tools Hub. Industrial Grade Precision.
          </p>
        </div>

        <div className={styles.linksRow}>
          <Link href="/about" className={styles.link}>About Us</Link>
          <Link href="/contact" className={styles.link}>Contact Sales</Link>
          <Link href="/track" className={styles.link}>Track Order</Link>
          <Link href="/refund" className={styles.link}>Refund Policy</Link>
          <Link href="/gst" className={styles.link}>GST Compliance</Link>
          <Link href="/dealer" className={styles.link}>Authorized Dealer</Link>
        </div>
      </div>
    </footer>
  );
};
