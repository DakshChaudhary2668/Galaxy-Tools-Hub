'use client';

import React from 'react';
import {
  Gauge, Flame, Thermometer, Zap, Activity, Battery, Scaling,
  Volume2, Monitor, Radio, Cpu, Compass, Sun, Droplets, Wind, Eye
} from 'lucide-react';
import styles from './CategoryMegaMenu.module.scss';

// ── Per-category item data ──────────────────────────────────────────────────

interface MenuItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

const TESTING_MEASUREMENT: MenuItem[] = [
  { name: 'Multimeter', href: 'https://galaxytoolshub.com/?page_id=6706', icon: Gauge },
  { name: 'Clampmeter', href: 'https://galaxytoolshub.com/?page_id=6930', icon: Activity },
  { name: 'Alcohal Meter', href: 'https://galaxytoolshub.com/?product_cat=alcohal-meter', icon: Droplets },
  { name: 'Carbon Dioxide Monitor', href: 'https://galaxytoolshub.com/?product_cat=carbon-dioxide-co2-monitor', icon: Flame },
  { name: 'Digital Elcb(RCD) Tester', href: 'https://galaxytoolshub.com/?product_cat=digital-elcbrcd-tester', icon: Zap },
  { name: 'Lcr Meter', href: 'https://galaxytoolshub.com/?product_cat=lcr-meter', icon: Activity },
  { name: 'Portable Multl-Gas Detector', href: 'https://galaxytoolshub.com/?product_cat=portable-multi-gas-detector', icon: Flame },
  { name: 'Sound Level Meter', href: 'https://galaxytoolshub.com/?product_cat=sound-level-meter', icon: Volume2 },
  { name: 'Insulation Tester', href: 'https://galaxytoolshub.com/?page_id=6946', icon: Zap },
  { name: 'Earth-Tester', href: 'https://galaxytoolshub.com/?page_id=6960', icon: Compass },
  { name: 'Anemometer', href: 'https://galaxytoolshub.com/?product_cat=anemometer', icon: Wind },
  { name: 'Carbon Monoxide Monitor', href: 'https://galaxytoolshub.com/?product_cat=carbon-monoxide-co-monitor', icon: Flame },
  { name: 'Digital Function Generator', href: 'https://galaxytoolshub.com/?product_cat=digital-function-generator', icon: Radio },
  { name: 'Moisture Meter', href: 'https://galaxytoolshub.com/?product_cat=moisture-meter', icon: Droplets },
  { name: 'Power Guard/Monitor', href: 'https://galaxytoolshub.com/?product_cat=power-guard-monitor', icon: Zap },
  { name: 'Ultrasonic Thickness Meter', href: 'https://galaxytoolshub.com/?product_cat=ultrasonic-thickness-meter', icon: Scaling },
  { name: 'Thermal Imager', href: 'https://galaxytoolshub.com/?page_id=6975', icon: Eye },
  { name: 'Calibrators', href: 'http://galaxytoolshub.com/?page_id=6985', icon: Scaling },
  { name: 'Battery Tester', href: 'https://galaxytoolshub.com/?product_cat=battery-tester', icon: Battery },
  { name: 'Coating Thickness Gauge', href: 'https://galaxytoolshub.com/?product_cat=coating-thickness-gauge', icon: Scaling },
  { name: 'Force Gauge', href: 'https://galaxytoolshub.com/?product_cat=force-gauge', icon: Gauge },
  { name: 'Oxygen Monitor', href: 'https://galaxytoolshub.com/?product_cat=oxygen-monitor', icon: Wind },
  { name: 'Tachometer', href: 'https://galaxytoolshub.com/?product_cat=tachometer', icon: Gauge },
  { name: 'Vibration Meter', href: 'https://galaxytoolshub.com/?product_cat=vibration-meter', icon: Activity },
  { name: 'Infrared Thermometer', href: 'https://galaxytoolshub.com/?page_id=6996', icon: Thermometer },
  { name: 'Digital Thermometer', href: 'https://galaxytoolshub.com/?page_id=7003', icon: Thermometer },
  { name: 'Capacitance Meter', href: 'https://galaxytoolshub.com/?product_cat=capacitance-meter', icon: Activity },
  { name: 'Digita Lux/Light Meter', href: 'https://galaxytoolshub.com/?product_cat=digita-lux-light-meter', icon: Sun },
  { name: 'Emf Meter', href: 'https://galaxytoolshub.com/?product_cat=emf-meter', icon: Zap },
  { name: 'Phase Sequence Indicator', href: 'https://galaxytoolshub.com/?product_cat=phase-sequence-indicator', icon: Activity },
  { name: 'Temperature Humidity Meter', href: 'https://galaxytoolshub.com/?product_cat=temperature-humidity-meter', icon: Thermometer },
];

const ENVIRONMENT: MenuItem[] = [
  { name: 'Hygro Thermometer', href: 'https://galaxytoolshub.com/?page_id=6706', icon: Thermometer },
  { name: 'Lux Meter', href: 'https://galaxytoolshub.com/?page_id=6930', icon: Sun },
  { name: 'Anemo Meter', href: 'https://galaxytoolshub.com/?product_cat=alcohal-meter', icon: Wind },
  { name: 'Tacho Meter', href: 'https://galaxytoolshub.com/?product_cat=carbon-dioxide-co2-monitor', icon: Gauge },
  { name: 'PH. Meter', href: 'https://galaxytoolshub.com/?product_cat=digital-elcbrcd-tester', icon: Droplets },
  { name: 'TDS Meter', href: 'https://galaxytoolshub.com/?product_cat=lcr-meter', icon: Droplets },
  { name: 'QRP Meter', href: 'https://galaxytoolshub.com/?product_cat=portable-multi-gas-detector', icon: Activity },
  { name: 'Humidity & Temperature', href: 'https://galaxytoolshub.com/?page_id=6946', icon: Thermometer },
  { name: 'Sound Level Meter', href: 'https://galaxytoolshub.com/?page_id=6960', icon: Volume2 },
  { name: 'Coating Thickness Meter', href: 'https://galaxytoolshub.com/?product_cat=anemometer', icon: Scaling },
  { name: 'Infrared Thermo Meter', href: 'https://galaxytoolshub.com/?product_cat=carbon-monoxide-co-monitor', icon: Thermometer },
  { name: 'Thermal Imager', href: 'https://galaxytoolshub.com/?product_cat=digital-function-generator', icon: Eye },
  { name: 'Laser Distance Meter', href: 'https://galaxytoolshub.com/?product_cat=moisture-meter', icon: Gauge },
];

const LABORATORY: MenuItem[] = [
  { name: 'Power Supply', href: 'https://galaxytoolshub.com/?page_id=6706', icon: Zap },
  { name: 'Oscilloscope/DSO', href: 'https://galaxytoolshub.com/?page_id=6930', icon: Monitor },
  { name: 'Calibrator', href: 'https://galaxytoolshub.com/?page_id=6975', icon: Scaling },
  { name: 'Stroboscops', href: 'https://galaxytoolshub.com/?page_id=6996', icon: Sun },
  { name: 'Function Generator', href: 'https://galaxytoolshub.com/?page_id=6946', icon: Radio },
  { name: 'Frequency Counter', href: 'https://galaxytoolshub.com/?page_id=6960', icon: Cpu },
  { name: 'Battery Tester', href: 'http://galaxytoolshub.com/?page_id=6985', icon: Battery },
  { name: 'Multi Gas Detector', href: 'https://galaxytoolshub.com/?page_id=7003', icon: Flame },
];

/** Map of category id → its menu items */
export const CATEGORY_MENUS: Record<string, MenuItem[]> = {
  testing: TESTING_MEASUREMENT,
  environmental: ENVIRONMENT,
  lab: LABORATORY,
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
                  <a
                    key={item.name}
                    href={item.href}
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={onClose}
                  >
                    <IconComp className={styles.icon} />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
