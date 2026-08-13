'use client';

import React from 'react';
import { Award, ShieldCheck, Box, Wrench, FileCheck, Target, FlaskConical } from 'lucide-react';
import { TRUST_BADGES } from '../../data/products';
import styles from './TrustStrip.module.scss';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Award,
  ShieldCheck,
  Box,
  Wrench,
  FileCheck,
  Target,
  FlaskConical,
};

export const TrustStrip: React.FC = () => {
  return (
    <section className={styles.stripSection}>
      <div className={styles.container}>
        <div className={styles.trustGrid}>
          {TRUST_BADGES.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Award;
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
