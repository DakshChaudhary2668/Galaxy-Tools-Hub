'use client';

import React from 'react';
import { ShieldCheck, Box, FileCheck } from 'lucide-react';
export interface TrustBadgeItem {
  id: string;
  icon: string;
  label: string;
}

const TRUST_BADGES: TrustBadgeItem[] = [
  { id: 'freight', icon: 'Box', label: 'WEIGHT-BASED FREIGHT' },
  { id: 'gst', icon: 'FileCheck', label: 'GST SHOWN AT CHECKOUT' },
  { id: 'warranty', icon: 'ShieldCheck', label: 'WARRANTY BY MODEL' },
];
import styles from './TrustStrip.module.scss';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  ShieldCheck,
  Box,
  FileCheck,
};

export const TrustStrip: React.FC = () => {
  return (
    <section className={styles.stripSection}>
      <div className={styles.container}>
        <div className={styles.trustGrid}>
          {TRUST_BADGES.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || ShieldCheck;
            return (
              <div key={item.id} className={styles.trustItem}>
                <div className={styles.iconSquare}>
                  <IconComponent className={styles.icon} />
                </div>
                <span className={styles.label}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
