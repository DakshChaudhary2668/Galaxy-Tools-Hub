'use client';

import React from 'react';
import Link from 'next/link';
import {
  Gauge, Flame, Thermometer, Zap, Activity, Battery, Scaling,
  Volume2, Monitor, Radio, Cpu, Compass, Sun, Droplets, Wind, Eye
} from 'lucide-react';
import styles from './CategoryMegaMenu.module.scss';

// ── Per-category item data ──────────────────────────────────────────────────

interface MenuItem {
  name: string;
  icon: React.FC<{ className?: string }>;
}

const TESTING_MEASUREMENT: MenuItem[] = [
  { name: 'Multimeter', icon: Gauge },
  { name: 'Clampmeter', icon: Activity },
  { name: 'Alcohal Meter', icon: Droplets },
  { name: 'Carbon Dioxide Monitor', icon: Flame },
  { name: 'Digital Elcb(RCD) Tester', icon: Zap },
  { name: 'Lcr Meter', icon: Activity },
  { name: 'Portable Multl-Gas Detector', icon: Flame },
  { name: 'Sound Level Meter', icon: Volume2 },
  { name: 'Insulation Tester', icon: Zap },
  { name: 'Earth-Tester', icon: Compass },
  { name: 'Anemometer', icon: Wind },
  { name: 'Carbon Monoxide Monitor', icon: Flame },
  { name: 'Digital Function Generator', icon: Radio },
  { name: 'Moisture Meter', icon: Droplets },
  { name: 'Power Guard/Monitor', icon: Zap },
  { name: 'Ultrasonic Thickness Meter', icon: Scaling },
  { name: 'Thermal Imager', icon: Eye },
  { name: 'Calibrators', icon: Scaling },
  { name: 'Battery Tester', icon: Battery },
  { name: 'Coating Thickness Gauge', icon: Scaling },
  { name: 'Force Gauge', icon: Gauge },
  { name: 'Oxygen Monitor', icon: Wind },
  { name: 'Tachometer', icon: Gauge },
  { name: 'Vibration Meter', icon: Activity },
  { name: 'Infrared Thermometer', icon: Thermometer },
  { name: 'Digital Thermometer', icon: Thermometer },
  { name: 'Capacitance Meter', icon: Activity },
  { name: 'Digita Lux/Light Meter', icon: Sun },
  { name: 'Emf Meter', icon: Zap },
  { name: 'Phase Sequence Indicator', icon: Activity },
  { name: 'Temperature Humidity Meter', icon: Thermometer },
];

const ENVIRONMENT: MenuItem[] = [
  { name: 'Hygro Thermometer', icon: Thermometer },
  { name: 'Lux Meter', icon: Sun },
  { name: 'Anemo Meter', icon: Wind },
  { name: 'Tacho Meter', icon: Gauge },
  { name: 'PH. Meter', icon: Droplets },
  { name: 'TDS Meter', icon: Droplets },
  { name: 'QRP Meter', icon: Activity },
  { name: 'Humidity & Temperature', icon: Thermometer },
  { name: 'Sound Level Meter', icon: Volume2 },
  { name: 'Coating Thickness Meter', icon: Scaling },
  { name: 'Infrared Thermo Meter', icon: Thermometer },
  { name: 'Thermal Imager', icon: Eye },
  { name: 'Laser Distance Meter', icon: Gauge },
];

const LABORATORY: MenuItem[] = [
  { name: 'Power Supply', icon: Zap },
  { name: 'Oscilloscope/DSO', icon: Monitor },
  { name: 'Calibrator', icon: Scaling },
  { name: 'Stroboscops', icon: Sun },
  { name: 'Function Generator', icon: Radio },
  { name: 'Frequency Counter', icon: Cpu },
  { name: 'Battery Tester', icon: Battery },
  { name: 'Multi Gas Detector', icon: Flame },
];

/** Map of category id → its menu items */
export const CATEGORY_MENUS: Record<string, MenuItem[]> = {
  testing: TESTING_MEASUREMENT,
  environmental: ENVIRONMENT,
  lab: LABORATORY,
};

const CATEGORY_SLUGS: Record<string, string> = {
  testing: 'testing-equipment',
  environmental: 'measuring-instruments',
  lab: 'electrical-tools'
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Split a flat array into `n` roughly-equal columns */
function toColumns<T>(items: T[], n: number): T[][] {
  const perCol = Math.ceil(items.length / n);
  const cols: T[][] = [];
  for (let i = 0; i < n; i++) {
    cols.push(items.slice(i * perCol, (i + 1) * perCol));
  }
  return cols.filter(c => c.length > 0);
}

/** Pick column count based on item count */
function columnCount(total: number): number {
  if (total <= 8) return 2;
  if (total <= 16) return 3;
  return 4;
}

// ── Component ───────────────────────────────────────────────────────────────

interface CategoryMegaMenuProps {
  categoryId: string;
  onClose: () => void;
}

export const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({ categoryId, onClose }) => {
  const items = CATEGORY_MENUS[categoryId];
  if (!items) return null;

  const cols = toColumns(items, columnCount(items.length));

  return (
    <div
      className={styles.megaMenuOverlay}
      onMouseLeave={onClose}
      role="menu"
      aria-label={`${categoryId} submenu`}
    >
      <div className={styles.container}>
        <div
          className={styles.megaGrid}
          style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
        >
          {cols.map((col, colIdx) => (
            <div key={colIdx} className={styles.column}>
              {col.map((item) => {
                const IconComp = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={`/products?category=${CATEGORY_SLUGS[categoryId]}&search=${encodeURIComponent(item.name)}`}
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={onClose}
                  >
                    <IconComp className={styles.icon} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
