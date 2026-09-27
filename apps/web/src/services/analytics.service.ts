import { apiClient } from './api';

export interface DashboardKPIs {
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
}

export interface RevenueTimelinePoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

export interface LowStockProduct {
  id: string;
  productName: string;
  sku: string;
  stock: number;
  threshold: number;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  totalQuantity?: number;
  unitsSold?: number;
  totalRevenue?: number;
  revenue?: number;
}

export interface TopCategory {
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface DetailedAnalyticsKPIs {
  totalRevenue: number;
  totalOrders: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  newCustomersCount: number;
  totalCustomersCount: number;
  cancelledOrdersCount: number;
  failedOrdersCount: number;
}

export interface DetailedAnalyticsData {
  kpis: DetailedAnalyticsKPIs;
  range: string;
  startDate: string;
  endDate: string;
  timeline: RevenueTimelinePoint[];
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  orderStatusDist: Record<string, number>;
  paymentStatusDist: Record<string, number>;
}

export interface DashboardSummaryData {
  kpis: DashboardKPIs;
  range: string;
  revenueTimeline: RevenueTimelinePoint[];
  recentOrders: RecentOrder[];
  lowStockItems: LowStockProduct[];
  topProducts: TopProduct[];
}

export async function getDashboardSummary(range = '30d'): Promise<DashboardSummaryData | null> {
  const res = await apiClient.get<{ data: DashboardSummaryData }>(`/analytics/dashboard-summary?range=${range}`);
  return res?.data || null;
}

export async function getDetailedAnalytics(params?: {
  range?: string;
  startDate?: string;
  endDate?: string;
}): Promise<DetailedAnalyticsData | null> {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val) queryObj[key] = val;
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  const res = await apiClient.get<{ data: DetailedAnalyticsData }>(`/analytics/detailed${qs}`);
  return res?.data || null;
}
