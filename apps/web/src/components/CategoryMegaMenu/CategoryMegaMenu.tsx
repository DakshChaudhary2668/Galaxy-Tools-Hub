'use client';

import React from 'react';
import Link from 'next/link';
import {
  Gauge, Flame, Thermometer, Zap, Activity, Battery, Scaling,
  Volume2, Monitor, Radio, Cpu, Compass, Sun, Droplets, Wind, Eye, ArrowRight
} from 'lucide-react';
import styles from './CategoryMegaMenu.module.scss';

interface CategoryMegaMenuProps {
  categorySlug: string;
  onClose: () => void;
}

export const MEGA_MENU_ITEMS = [
  // Column 1
  [
    { name: 'Multimeter', icon: Gauge },
    { name: 'Clampmeter', icon: Activity },
    { name: 'Calibrators', icon: Scaling },
    { name: 'Battery Tester', icon: Battery },
    { name: 'Coating Thickness Gauge', icon: Scaling },
    { name: 'Sound Level Meter', icon: Volume2 },
    { name: 'Oscilloscope/DSO', icon: Monitor },
    { name: 'Function Generator', icon: Radio },
    { name: 'Frequency Counter', icon: Cpu },
  ],
  // Column 2
  [
    { name: 'Insulation Tester', icon: Zap },
    { name: 'Earth-Tester', icon: Compass },
    { name: 'Anemometer', icon: Wind },
    { name: 'Carbon Dioxide Monitor', icon: Flame },
    { name: 'Carbon Monoxide Monitor', icon: Flame },
    { name: 'Digital Function Generator', icon: Radio },
    { name: 'Moisture Meter', icon: Droplets },
    { name: 'Power Guard/Monitor', icon: Zap },
    { name: 'Ultrasonic Thickness Meter', icon: Scaling },
  ],
  // Column 3
  [
    { name: 'Thermal Imager', icon: Eye },
    { name: 'Infrared Thermometer', icon: Thermometer },
    { name: 'Digital Thermometer', icon: Thermometer },
    { name: 'Capacitance Meter', icon: Activity },
    { name: 'Digital Lux/Light Meter', icon: Sun },
    { name: 'EMF Meter', icon: Zap },
    { name: 'Phase Sequence Indicator', icon: Activity },
    { name: 'Temperature Humidity Meter', icon: Thermometer },
    { name: 'Vibration Meter', icon: Activity },
  ],
  // Column 4
  [
    { name: 'Hygro Thermometer', icon: Thermometer },
    { name: 'Lux Meter', icon: Sun },
    { name: 'Anemo Meter', icon: Wind },
    { name: 'Tacho Meter', icon: Gauge },
    { name: 'pH Meter', icon: Droplets },
    { name: 'TDS Meter', icon: Droplets },
    { name: 'QRP Meter', icon: Activity },
    { name: 'Humidity & Temperature', icon: Thermometer },
    { name: 'Air Quality Meter', icon: Wind },
  ],
  // Column 5
  [
    { name: 'Power Supply', icon: Zap },
    { name: 'Oscilloscope/DSO', icon: Monitor },
    { name: 'Calibrator', icon: Scaling },
    { name: 'Stroboscopes', icon: Sun },
    { name: 'Function Generator', icon: Radio },
    { name: 'Frequency Counter', icon: Cpu },
    { name: 'Battery Tester', icon: Battery },
    { name: 'Multi Gas Detector', icon: Flame },
  ],
];

export const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({ categorySlug, onClose }) => {
  return (
    <div className={styles.megaMenuOverlay} onMouseLeave={onClose}>
      <div className={styles.container}>
        <div className={styles.megaGrid}>
          {MEGA_MENU_ITEMS.map((col, colIdx) => (
            <div key={colIdx} className={styles.column}>
              {col.map((item, itemIdx) => {
                const IconComp = item.icon;
                return (
                  <Link
                    key={itemIdx}
                    href={`/category/${categorySlug}?sub=${encodeURIComponent(item.name)}`}
                    className={styles.menuItem}
                    onClick={onClose}
                  >
                    <IconComp className={styles.icon} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {colIdx === MEGA_MENU_ITEMS.length - 1 && (
                <Link
                  href={`/category/${categorySlug}`}
                  className={styles.viewAllBtn}
                  onClick={onClose}
                >
                  <span>View All Lab Testing Items</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
