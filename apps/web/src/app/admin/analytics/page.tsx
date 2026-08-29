'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Info,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import {
  getDetailedAnalytics,
  DetailedAnalyticsData
} from '../../../services/analytics.service';
import styles from './Analytics.module.scss';

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const [data, setData] = useState<DetailedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = isCustom && customStart && customEnd
        ? { startDate: customStart, endDate: customEnd }
        : { range };

      const res = await getDetailedAnalytics(params);
      if (res && res.data) {
        setData(res.data);
      } else {
        setError('Analytics metrics could not be retrieved.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve analytics data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [range, isCustom, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRangeChange = (newRange: string) => {
    setIsCustom(false);
    setRange(newRange);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setIsCustom(true);
      fetchAnalytics();
    }
  };

  const formatPrice = (amount?: number | null) =>
    new Intl.NumberFormat('en-IN').format(amount || 0);

  if (loading && !data) {
    return (
      <div className={styles.stateBox}>
        <Loader2 size={40} className="animate-spin" color="#F5C710" />
        <h3>Computing Real Business Analytics...</h3>
        <p>Aggregating verified order transactions, fulfillment pipelines, and customer volumes.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.stateBox}>
        <AlertCircle size={48} color="#DC2626" />
        <h3>Analytics Service Unavailable</h3>
        <p>{error || 'Failed to aggregate store metrics.'}</p>
        <button
          type="button"
          className={styles.rangeSelector}
          onClick={fetchAnalytics}
          style={{ marginTop: '12px' }}
        >
          <RotateCcw size={14} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const { kpis, timeline, topProducts, topCategories, orderStatusDist, paymentStatusDist } = data;

  // Max revenue for bar scaling
  const maxRev = Math.max(...timeline.map((t) => t.revenue), 1000);

  // Status totals for distribution percentages
  const totalOrdersCount = Math.max(kpis.totalOrders, 1);
  const totalPaymentsCount = Math.max(
    Object.values(paymentStatusDist).reduce((sum, v) => sum + v, 0),
    1
  );

  return (
    <div className={styles.analyticsContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Store Performance & Analytics</h1>
          <p>Verified executive intelligence calculated from live Supabase transactional ledger.</p>
        </div>

        <div className={styles.rangeSelector}>
          <button
            type="button"
            className={range === '7d' && !isCustom ? styles.active : ''}
            onClick={() => handleRangeChange('7d')}
          >
            7 Days
          </button>
          <button
            type="button"
            className={range === '30d' && !isCustom ? styles.active : ''}
            onClick={() => handleRangeChange('30d')}
          >
            30 Days
          </button>
          <button
            type="button"
            className={range === '3m' && !isCustom ? styles.active : ''}
            onClick={() => handleRangeChange('3m')}
          >
            3 Months
          </button>
          <button
            type="button"
            className={range === '1y' && !isCustom ? styles.active : ''}
            onClick={() => handleRangeChange('1y')}
          >
            1 Year
          </button>
          <button
            type="button"
            className={isCustom ? styles.active : ''}
            onClick={() => setIsCustom(true)}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Form */}
      {isCustom && (
        <form onSubmit={handleApplyCustom} className={styles.customDateBar}>
          <label htmlFor="cStart">From:</label>
          <input
            id="cStart"
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            required
          />
          <label htmlFor="cEnd">To:</label>
          <input
            id="cEnd"
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            required
          />
          <button type="submit" className={styles.applyBtn}>
            Apply Date Window
          </button>
        </form>
      )}

      {/* 5 KPI Executive Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.label}>Net Revenue</span>
            <div className={styles.iconBox}>
              <IndianRupee size={16} />
            </div>
          </div>
          <span className={styles.value}>₹{formatPrice(kpis.totalRevenue)}</span>
          <span className={styles.subtext}>Paid & confirmed transactions</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.label}>Total Orders</span>
            <div className={styles.iconBox}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <span className={styles.value}>{kpis.totalOrders}</span>
          <span className={styles.subtext}>{kpis.paidOrdersCount} paid, {kpis.cancelledOrdersCount} cancelled</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.label}>Avg Order Value</span>
            <div className={styles.iconBox}>
              <TrendingUp size={16} />
            </div>
          </div>
          <span className={styles.value}>₹{formatPrice(kpis.averageOrderValue)}</span>
          <span className={styles.subtext}>Revenue ÷ paid orders</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.label}>Tools Sold</span>
            <div className={styles.iconBox}>
              <Package size={16} />
            </div>
          </div>
          <span className={styles.value}>{kpis.totalUnitsSold} units</span>
          <span className={styles.subtext}>Across fulfilled orders</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.label}>Buyers & Growth</span>
            <div className={styles.iconBox}>
              <Users size={16} />
            </div>
          </div>
          <span className={styles.value}>+{kpis.newCustomersCount}</span>
          <span className={styles.subtext}>{kpis.totalCustomersCount} total buyer accounts</span>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2>
            <TrendingUp size={17} />
            <span>Revenue Timeline</span>
          </h2>
          <span className={styles.tag}>{timeline.length} Time Intervals</span>
        </div>

        <div className={styles.chartContainer}>
          {timeline.map((point, idx) => {
            const heightPercent = Math.max(Math.round((point.revenue / maxRev) * 100), point.revenue > 0 ? 8 : 2);
            return (
              <div key={idx} className={styles.barCol}>
                <div
                  className={styles.barWrapper}
                  title={`${point.label}: ₹${formatPrice(point.revenue)} (${point.orders} orders)`}
                >
                  <div
                    className={styles.barFill}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={styles.barLabel}>{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column: Order Status & Payment Breakdown */}
      <div className={styles.grid2Col}>
        {/* Order Status Distribution */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2>
              <ShieldCheck size={17} />
              <span>Order Fulfillment Status</span>
            </h2>
          </div>

          <div className={styles.distList}>
            {Object.entries(orderStatusDist).length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>No orders in this time window.</p>
            ) : (
              Object.entries(orderStatusDist).map(([st, count]) => {
                const percent = Math.round((count / totalOrdersCount) * 100);
                const isPaid = st.toLowerCase().includes('paid') || st.toLowerCase().includes('delivered');
                const isCancelled = st.toLowerCase().includes('cancel');
                return (
                  <div key={st} className={styles.distRow}>
                    <div className={styles.distHeader}>
                      <span>{st}</span>
                      <span className={styles.distCount}>{count} orders ({percent}%)</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${isPaid ? styles.green : isCancelled ? styles.red : styles.yellow}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2>
              <CheckCircle2 size={17} />
              <span>Payment Gateway Integrity</span>
            </h2>
          </div>

          <div className={styles.distList}>
            {Object.entries(paymentStatusDist).length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>No payment events in this period.</p>
            ) : (
              Object.entries(paymentStatusDist).map(([pSt, count]) => {
                const percent = Math.round((count / totalPaymentsCount) * 100);
                const isPaid = pSt === 'PAID';
                const isFailed = pSt === 'FAILED';
                return (
                  <div key={pSt} className={styles.distRow}>
                    <div className={styles.distHeader}>
                      <span>{pSt}</span>
                      <span className={styles.distCount}>{count} payments ({percent}%)</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${isPaid ? styles.green : isFailed ? styles.red : styles.yellow}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2-Column: Top Products & Top Categories */}
      <div className={styles.grid2Col}>
        {/* Top Products */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2>
              <Package size={17} />
              <span>Top Performing Products</span>
            </h2>
          </div>

          {topProducts.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>No product sales recorded yet.</p>
          ) : (
            <table className={styles.leaderTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0F172A' }}>{p.name}</strong>
                        <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                          SKU: {p.sku}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.unitsSold || p.totalQuantity || 0}</td>
                    <td className={styles.amountCell}>
                      ₹{formatPrice(p.revenue || p.totalRevenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Categories */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeader}>
            <h2>
              <Layers size={17} />
              <span>Revenue by Tool Category</span>
            </h2>
          </div>

          {topCategories.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>No category aggregations available.</p>
          ) : (
            <table className={styles.leaderTable}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topCategories.map((c, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ color: '#0F172A' }}>{c.name}</strong>
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.unitsSold}</td>
                    <td className={styles.amountCell}>
                      ₹{formatPrice(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Metric Definitions & Calculation Transparency Box */}
      <div className={styles.documentationBox}>
        <h3>
          <Info size={16} />
          <span>Metric Calculation Transparency & Audit Rules</span>
        </h3>
        <div className={styles.defGrid}>
          <div className={styles.defItem}>
            <strong>Net Revenue</strong>
            <p>
              Sum of <code>total_amount</code> from orders with verified <code>payment_status = &apos;PAID&apos;</code>. Failed, cancelled, and unpaid draft orders are strictly excluded.
            </p>
          </div>

          <div className={styles.defItem}>
            <strong>Average Order Value (AOV)</strong>
            <p>
              Calculated as <code>Net Revenue ÷ Paid Orders Count</code>. Cancelled and failed checkouts do not dilute the average cart sizing.
            </p>
          </div>

          <div className={styles.defItem}>
            <strong>Tool Units Sold</strong>
            <p>
              Sum of line item quantities in confirmed and paid customer orders, sourced from the <code>order_items</code> database ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
