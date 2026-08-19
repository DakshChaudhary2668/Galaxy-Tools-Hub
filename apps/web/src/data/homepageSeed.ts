/**
 * Homepage seed/demo data — replace with real API data when available.
 * ponytail: all products reuse the 4 existing product images rotated. Replace with real images when available.
 */

import { Product } from '../types/product';

// ── Images pool (rotate existing assets) ────────────────────────────────────
const IMG = [
  '/images/product-gt91.jpg',
  '/images/product-dm98.jpg',
  '/images/product-108p.jpg',
  '/images/product-ctg999.jpg',
];
const img = (i: number) => IMG[i % IMG.length];

// ── Trending Products ───────────────────────────────────────────────────────
export const TRENDING_PRODUCTS: Product[] = [
  { id: 'tr01', name: 'UT203+ Digital Clamp Meter', category: 'CLAMPMETER', price: 3995, originalPrice: 4950, discount: 19, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(0), technicalSpecs: 'AC/DC 400A | TRUE RMS', badge: 'Trending' },
  { id: 'tr02', name: 'Rigol DS1054Z Oscilloscope', category: 'OSCILLOSCOPE', price: 28500, currency: '₹', gstIncluded: true, status: 'LEAD_TIME', statusLabel: 'LEAD: 5 DAYS', image: img(1), technicalSpecs: '50MHz | 4 CHANNEL', badge: 'Bestseller' },
  { id: 'tr03', name: 'Adjustable DC Power Supply 30V/5A', category: 'POWER SUPPLY', price: 4200, originalPrice: 4800, discount: 13, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(2), technicalSpecs: '0-30V | 0-5A | DIGITAL' },
  { id: 'tr04', name: 'G-Tech Portable Multi-Gas Detector', category: 'GAS DETECTOR', price: 18500, currency: '₹', gstIncluded: true, status: 'SPECIAL_ORDER', statusLabel: 'SPECIAL ORDER', image: img(3), technicalSpecs: '4 IN 1 | LEL/O2/CO/H2S', badge: 'Trending' },
  { id: 'tr05', name: 'FLIR TG165-X Thermal Imager', category: 'THERMAL IMAGER', price: 32000, originalPrice: 36000, discount: 11, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(0), technicalSpecs: '-25°C TO 300°C | IR' },
  { id: 'tr06', name: 'HTC SL-1350 Sound Level Meter', category: 'SOUND METER', price: 5600, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(1), technicalSpecs: '30-130dB | TYPE 2', badge: 'Trending' },
  { id: 'tr07', name: 'MECO BM63 Battery Tester', category: 'BATTERY TESTER', price: 3200, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(2), technicalSpecs: '6V/12V | DIGITAL' },
  { id: 'tr08', name: 'Kyoritsu DT-2268 Tachometer', category: 'TACHOMETER', price: 4800, originalPrice: 5500, discount: 13, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(3), technicalSpecs: 'PHOTO/CONTACT | DIGITAL' },
  { id: 'tr09', name: 'UNI-T UT612 LCR Meter', category: 'LCR METER', price: 9800, currency: '₹', gstIncluded: true, status: 'LEAD_TIME', statusLabel: 'LEAD: 3 DAYS', image: img(0), technicalSpecs: '100KHZ | USB', badge: 'Bestseller' },
  { id: 'tr10', name: 'MECO 6250 Insulation Tester', category: 'INSULATION TESTER', price: 7200, originalPrice: 8200, discount: 12, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(1), technicalSpecs: '2500V | DIGITAL' },
];

// ── Discounted Products ─────────────────────────────────────────────────────
export const DISCOUNTED_PRODUCTS: Product[] = [
  { id: 'dc01', name: 'UNI-T UT33C+ Multimeter', category: 'MULTIMETER', price: 1299, originalPrice: 1799, discount: 28, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(0), technicalSpecs: '2000 COUNTS | MANUAL' },
  { id: 'dc02', name: 'HTC CL-2060 Clamp Meter', category: 'CLAMPMETER', price: 2450, originalPrice: 3200, discount: 23, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(1), technicalSpecs: 'AC 600A | AUTO RANGE' },
  { id: 'dc03', name: 'G-Tech IR-66B Thermometer', category: 'THERMOMETER', price: 1850, originalPrice: 2500, discount: 26, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(2), technicalSpecs: '-50°C TO 380°C | LASER' },
  { id: 'dc04', name: 'MECO MM-01 Moisture Meter', category: 'MOISTURE METER', price: 2100, originalPrice: 2900, discount: 28, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(3), technicalSpecs: 'WOOD/CONCRETE | PIN TYPE' },
  { id: 'dc05', name: 'UNI-T UT383 Lux Meter', category: 'LUX METER', price: 2800, originalPrice: 3499, discount: 20, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(0), technicalSpecs: '0-200,000 LUX | DIGITAL' },
  { id: 'dc06', name: 'HTC TH-01 Temp Humidity Meter', category: 'ENVIRONMENT', price: 1350, originalPrice: 1800, discount: 25, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(1), technicalSpecs: '-20°C TO 60°C | LCD' },
  { id: 'dc07', name: 'G-Tech BT-168D Battery Tester', category: 'BATTERY TESTER', price: 450, originalPrice: 699, discount: 36, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(2), technicalSpecs: '1.5V/9V | UNIVERSAL' },
  { id: 'dc08', name: 'UNI-T UT372 Tachometer', category: 'TACHOMETER', price: 3200, originalPrice: 3999, discount: 20, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(3), technicalSpecs: '10-99999 RPM | LASER' },
  { id: 'dc09', name: 'HTC SL-04 Sound Level Meter', category: 'SOUND METER', price: 3400, originalPrice: 4500, discount: 24, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(0), technicalSpecs: '30-130dB | A/C WEIGHTING' },
  { id: 'dc10', name: 'UNI-T LM600 Laser Distance Meter', category: 'DISTANCE METER', price: 4200, originalPrice: 5500, discount: 24, currency: '₹', gstIncluded: true, status: 'IN_STOCK', statusLabel: 'IN STOCK', image: img(1), technicalSpecs: '0.05-60M | ±2MM' },
];

// ── Top Categories ──────────────────────────────────────────────────────────
export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  href: string;
}

export const TOP_CATEGORIES: CategoryItem[] = [
  { id: 'cat-multi', name: 'Testing & Measurement', image: '/images/cat-multimeter.jpg', href: '/categories' },
  { id: 'cat-clamp', name: 'Clampmeters', image: '/images/cat-clampmeter.jpg', href: '/categories' },
  { id: 'cat-osc', name: 'Oscilloscopes', image: '/images/cat-oscilloscope.jpg', href: '/categories' },
  { id: 'cat-therm', name: 'Thermal Imaging', image: '/images/cat-thermal.jpg', href: '/categories' },
  { id: 'cat-ins', name: 'Insulation Testers', image: '/images/cat-insulation.jpg', href: '/categories' },
  { id: 'cat-cal', name: 'Calibrators', image: '/images/cat-calibrators.jpg', href: '/categories' },
  { id: 'cat-coat', name: 'Coating Gauges', image: '/images/cat-coating.jpg', href: '/categories' },
  { id: 'cat-snd', name: 'Sound Level Meters', image: '/images/cat-sound.jpg', href: '/categories' },
  { id: 'cat-ir', name: 'Infrared Thermometers', image: '/images/cat-infrared.jpg', href: '/categories' },
  { id: 'cat-bat', name: 'Battery Testers', image: '/images/cat-battery.jpg', href: '/categories' },
];

// ── Latest Blogs ────────────────────────────────────────────────────────────
export interface BlogItem {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  image: string;
  href: string;
}

export const LATEST_BLOGS: BlogItem[] = [
  { id: 'blog-01', title: 'How to Choose the Right Digital Multimeter', excerpt: 'A buyer\'s guide covering counts, accuracy class, safety category, and feature checklist for industrial multimeters.', tag: 'Buying Guide', image: '/images/cat-multimeter.jpg', href: '#' },
  { id: 'blog-02', title: 'Multimeter vs Clamp Meter: Which One Should You Use?', excerpt: 'Understand when to reach for a clamp meter over a standard DMM and the trade-offs in accuracy and convenience.', tag: 'Comparison', image: '/images/cat-clampmeter.jpg', href: '#' },
  { id: 'blog-03', title: 'Understanding Oscilloscopes for Beginners', excerpt: 'Bandwidth, sample rate, channels — decoded for engineers setting up their first bench.', tag: 'Tutorial', image: '/images/cat-oscilloscope.jpg', href: '#' },
  { id: 'blog-04', title: '5 Essential Testing Tools for Electrical Engineers', excerpt: 'The minimum kit every field engineer should carry, from insulation testers to IR thermometers.', tag: 'Industry', image: '/images/cat-insulation.jpg', href: '#' },
];

// ── Brands ───────────────────────────────────────────────────────────────────
export interface BrandItem {
  id: string;
  name: string;
}

export const BRAND_LIST: BrandItem[] = [
  { id: 'b01', name: 'UNI-T' },
  { id: 'b02', name: 'Fluke' },
  { id: 'b03', name: 'MECO' },
  { id: 'b04', name: 'Kyoritsu' },
  { id: 'b05', name: 'HTC' },
  { id: 'b06', name: 'HIOKI' },
  { id: 'b07', name: 'Extech' },
  { id: 'b08', name: 'Mitutoyo' },
  { id: 'b09', name: 'Insize' },
  { id: 'b10', name: 'G-Tech' },
];
