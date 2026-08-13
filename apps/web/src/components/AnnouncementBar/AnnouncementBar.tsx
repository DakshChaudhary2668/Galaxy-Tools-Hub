import React from 'react';
import { Truck } from 'lucide-react';
import styles from './AnnouncementBar.module.scss';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className={styles.bar}>
      <div className={styles.content}>
        <Truck className={styles.icon} />
        <span>FREE SHIPPING ON BULK ORDERS ABOVE ₹50,000 | GST INVOICE AVAILABLE</span>
      </div>
    </div>
  );
};
