export type StatusType = 'IN_STOCK' | 'LEAD_TIME' | 'SPECIAL_ORDER';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  gstIncluded: boolean;
  status: StatusType;
  statusLabel: string;
  image: string;
  secondaryAction?: 'SPECS' | 'QUOTE';
  technicalSpecs: string;
  originalPrice?: number;
  discount?: number;
  badge?: string;
}

export interface TrustBadgeItem {
  id: string;
  icon: string;
  label: string;
}
