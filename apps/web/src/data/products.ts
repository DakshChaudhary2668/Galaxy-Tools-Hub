import { Product, TrustBadgeItem } from '../types/product';

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 'gt91',
    name: 'G-Tech GT91',
    category: 'MULTIMETER',
    price: 1622,
    currency: '₹',
    gstIncluded: true,
    status: 'IN_STOCK',
    statusLabel: 'IN STOCK',
    image: '/images/product-gt91.jpg',
    technicalSpecs: '6000 COUNTS | AUTO RANGING',
  },
  {
    id: 'dm98',
    name: 'HTC DM-98',
    category: 'MULTIMETER',
    price: 2448,
    currency: '₹',
    gstIncluded: true,
    status: 'LEAD_TIME',
    statusLabel: 'LEAD: 2 DAYS',
    image: '/images/product-dm98.jpg',
    technicalSpecs: 'TRUE RMS | 1000V CAT III',
  },
  {
    id: '108p',
    name: 'MECO 108P+',
    category: 'MULTIMETER',
    price: 1890,
    currency: '₹',
    gstIncluded: true,
    status: 'IN_STOCK',
    statusLabel: 'IN STOCK',
    image: '/images/product-108p.jpg',
    technicalSpecs: 'POCKET SIZE | 4000 COUNTS',
  },
  {
    id: 'ctg999',
    name: 'G-Tech CTG999',
    category: 'MEASURING',
    price: 10738,
    currency: '₹',
    gstIncluded: true,
    status: 'SPECIAL_ORDER',
    statusLabel: 'SPECIAL ORDER',
    image: '/images/product-ctg999.jpg',
    secondaryAction: 'SPECS',
    technicalSpecs: 'COATING GAUGE | Fe/NFe',
  },
];

export const TRUST_BADGES: TrustBadgeItem[] = [
  { id: 'iso', icon: 'Award', label: 'ISO 9001' },
  { id: 'secure', icon: 'ShieldCheck', label: 'SECURE' },
  { id: 'oem', icon: 'Box', label: 'OEM DIRECT' },
  { id: 'calibrated', icon: 'Wrench', label: 'CALIBRATED' },
  { id: 'compliant', icon: 'FileCheck', label: 'COMPLIANT' },
  { id: 'precise', icon: 'Target', label: 'PRECISE' },
  { id: 'tested', icon: 'FlaskConical', label: 'TESTED' },
];

export const CATEGORIES = [
  { id: 'testing', label: 'TESTING & MEASUREMENT EQ.' },
  { id: 'environmental', label: 'ENVIRONMENTAL' },
  { id: 'lab', label: 'LAB TESTING ITEMS', active: true },
  { id: 'accessories', label: 'ACCESSORIES' },
  { id: 'safety', label: 'SAFETY' },
  { id: 'machinery', label: 'MACHINERY' },
];
