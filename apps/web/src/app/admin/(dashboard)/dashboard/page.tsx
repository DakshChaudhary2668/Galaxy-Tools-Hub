'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Users,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Boxes,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  getDashboardSummary,
  DashboardSummaryData
} from '@/services/analytics.service';
import styles from './Dashboard.module.scss';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (selectedRange: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardSummary(selectedRange);
      if (res) {
        setData(res);
      } else {
        setError('No summary data returned from the server.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const formatPrice = (amount?: number) =>
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount || 0);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(
    ...(data?.revenueTimeline.map((p) => p.revenue) || [10000]),
    1000
  );

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Store Dashboard</h1>
          <p>Real-time overview of operational sales, pending orders, and inventory status.</p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => fetchData(range)}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error ? (
        /* Error State */
        <div className={styles.stateCard}>
          <AlertCircle size={48} color="#DC2626" />
          <h3>Failed to Load Dashboard</h3>
          <p>{error}</p>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => fetchData(range)}
            style={{ marginTop: '12px' }}
          >
            <span>Retry Loading</span>
          </button>
        </div>
      ) : loading && !data ? (
        /* Initial Loading State */
        <div className={styles.stateCard}>
          <Loader2 size={40} className="animate-spin" color="#F5C710" />
          <h3>Retrieving Analytics...</h3>
          <p>Compiling database sales and inventory records.</p>
        </div>
      ) : (
        <>
          {/* Top KPI Cards (6 Cards) */}
          <div className={styles.kpiGrid}>
            {/* 1. Today's Sales */}
            <div className={styles.kpiCard}>
              <div className={styles.cardTop}>
                <span>Today&apos;s Sales</span>
                <div className={styles.iconWrap}>
                  <DollarSign size={16} />
                </div>
              </div>
              <div className={styles.value}>₹{formatPrice(data?.kpis.todaySales || 0)}</div>
              <div className={`${styles.meta} ${styles.positive}`}>
                <TrendingUp size={12} />
                <span>Paid orders today</span>
              </div>
            </div>

            {/* 2. Total Orders */}
            <div className={styles.kpiCard}>
              <div className={styles.cardTop}>
                <span>Total Orders</span>
                <div className={styles.iconWrap}>
                  <ShoppingCart size={16} />
                </div>
              </div>
              <div className={styles.value}>{data?.kpis.totalOrders || 0}</div>
              <div className={styles.meta}>
                <span>Lifetime transactions</span>
              </div>
            </div>

            {/* 3. Pending Orders */}
            <div className={styles.kpiCard}>
              <div className={styles.cardTop}>
                <span>Pending Orders</span>
                <div className={styles.iconWrap}>
                  <Clock size={16} />
                </div>
              </div>
              <div className={styles.value}>{data?.kpis.pendingOrders || 0}</div>
              <div className={`${styles.meta} ${(data?.kpis.pendingOrders || 0) > 0 ? styles.warning : ''}`}>
                <span>Requires processing</span>
              </div>
            </div>

            {/* 4. Total Products */}
            <div className={styles.kpiCard}>
              <div className={styles.cardTop}>
                <span>Products</span>
                <div className={styles.iconWrap}>
                  <Package size={16} />
                </div>
              </div>
              <div className={styles.value}>{data?.kpis.totalProducts || 0}</div>
              <div className={styles.meta}>
                <span>Active catalog items</span>
              </div>
            </div>

            {/* 5. Low Stock Products */}
            <div className={styles.kpiCard}>
              <div className={styles.cardTop}>
                <span>Low Stock</span>
                <div className={styles.iconWrap}>
                  <AlertTriangle size={16} color="#DC2626" />
                </div>
              </div>
              <div className={styles.value}>{data?.kpis.lowStockProducts || 0}</div>
              <div className={`${styles.meta} ${(data?.kpis.lowStockProducts || 0) > 0 ? styles.danger : ''}`}>
                <span>Near threshold level</span>
              </div>
            </div>

            {/* 6. Customers */}
            <div className={styles.kpiCard}>
              <div className={styles.cardTop}>
                <span>Customers</span>
                <div className={styles.iconWrap}>
                  <Users size={16} />
                </div>
              </div>
              <div className={styles.value}>{data?.kpis.totalCustomers || 0}</div>
              <div className={styles.meta}>
                <span>Registered client base</span>
              </div>
            </div>
          </div>

          {/* Revenue & Volume Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>
                <h2>Sales Revenue & Activity</h2>
                <p>Gross transaction volume over selected timeframe</p>
              </div>

              <div className={styles.rangeFilter}>
                {(['7d', '30d', '3m', '1y'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={range === r ? styles.activeRange : ''}
                    onClick={() => setRange(r)}
                  >
                    {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '3m' ? '3 Months' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Visual */}
            <div className={styles.chartVisual}>
              {data?.revenueTimeline && data.revenueTimeline.length > 0 ? (
                data.revenueTimeline.map((point) => {
                  const heightPercent = maxRevenue > 0 ? Math.max((point.revenue / maxRevenue) * 100, 3) : 3;

                  return (
                    <div key={point.date} className={styles.barCol}>
                      <div className={styles.tooltip}>
                        <div>{point.label}</div>
                        <div>₹{formatPrice(point.revenue)} ({point.orders} orders)</div>
                      </div>
                      <div
                        className={styles.barFill}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className={styles.xLabel}>{point.label}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ margin: 'auto', color: '#94A3B8', fontSize: '13px' }}>
                  No revenue transactions recorded for this period.
                </div>
              )}
            </div>
          </div>

          {/* 2-Column Section: Recent Orders (Left) & Low Stock Alerts (Right) */}
          <div className={styles.sectionGrid}>
            {/* Left: Recent Orders */}
            <div className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <h3>Recent Orders</h3>
                <Link href="/admin/orders" className={styles.viewAllLink}>
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentOrders && data.recentOrders.length > 0 ? (
                      data.recentOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          onClick={() => router.push(`/admin/orders/${ord.id}`)}
                          title={`View details for ${ord.orderNumber}`}
                        >
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>{ord.orderNumber}</td>
                          <td>{ord.customerName}</td>
                          <td className={styles.amountCell}>₹{formatPrice(ord.totalAmount)}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                ord.paymentStatus === 'PAID' ? styles.paid : styles.pending
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                ord.orderStatus === 'Shipped' || ord.orderStatus === 'Delivered'
                                  ? styles.shipped
                                  : ord.orderStatus === 'Cancelled'
                                  ? styles.cancelled
                                  : styles.pending
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td style={{ color: '#64748B', fontSize: '12px' }}>{formatDate(ord.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                          No orders placed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Low Stock Alert */}
            <div className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <h3>Low Stock Items</h3>
                <Link href="/admin/inventory" className={styles.viewAllLink}>
                  <span>View Inventory</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className={styles.stockList}>
                {data?.lowStockItems && data.lowStockItems.length > 0 ? (
                  data.lowStockItems.map((item) => (
                    <div key={item.id} className={styles.stockItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.name} title={item.productName}>
                          {item.productName}
                        </span>
                        <span className={styles.sku}>SKU: {item.sku}</span>
                      </div>
                      <div className={styles.stockNumbers}>
                        <span className={styles.count}>{item.stock} left</span>
                        <span
                          className={`${styles.statusBadge} ${
                            item.status === 'OUT_OF_STOCK' ? styles.outOfStock : styles.lowStock
                          }`}
                        >
                          {item.status === 'OUT_OF_STOCK' ? 'Out' : 'Low'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '13px' }}>
                    <Boxes size={32} style={{ margin: '0 auto 8px', color: '#10B981' }} />
                    <p style={{ fontWeight: 600 }}>All items above safety stock levels.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          {data?.topProducts && data.topProducts.length > 0 && (
            <div className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <h3>Top Selling Instruments</h3>
                <Link href="/admin/products" className={styles.viewAllLink}>
                  <span>Manage Catalog</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU Identifier</th>
                      <th>Total Units Sold</th>
                      <th>Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ fontWeight: 700 }}>{prod.name}</td>
                        <td style={{ color: '#64748B', fontFamily: 'monospace' }}>{prod.sku}</td>
                        <td style={{ fontWeight: 800 }}>{prod.totalQuantity} units</td>
                        <td className={styles.amountCell}>₹{formatPrice(prod.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
