import React from 'react';
import { Truck } from 'lucide-react';
import styles from './AnnouncementBar.module.scss';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className={styles.bar}>
      <div className={styles.content}>
        <Truck className={styles.icon} />
        <span>WEIGHT-BASED FREIGHT | GST INVOICE AVAILABLE</span>
      </div>
    </div>
  );
};
