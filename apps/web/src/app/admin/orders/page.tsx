'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  RefreshCw,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  AdminOrderListItem
} from '../../../services/order.service';
import styles from './Orders.module.scss';

export default function AdminOrdersPage() {


  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Data States
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOrders({
        page,
        limit: 20,
        search: debouncedSearch,
        status: statusFilter,
        paymentStatus: paymentFilter,
        dateRange: dateFilter
      });

      if (res && res.data) {
        setOrders(res.data);
        setTotalCount(res.meta?.total || res.data.length);
        setTotalPages(res.meta?.totalPages || 1);
      } else {
        setOrders([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve orders.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, paymentFilter, dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    if (!newStatus) return;
    if (newStatus === 'Cancelled' && !confirm('Are you sure you want to cancel this order and release inventory?')) {
      return;
    }

    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setActionSuccess(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}`);
      fetchOrders();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      alert(`Error updating order: ${msg}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setDateFilter('all');
    setPage(1);
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-IN').format(amount);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s.includes('paid')) return styles.paid;
    if (s.includes('shipped')) return styles.shipped;
    if (s.includes('delivered')) return styles.delivered;
    if (s.includes('cancel')) return styles.cancelled;
    if (s.includes('refund')) return styles.refunded;
    return styles.pending;
  };

  return (
    <div className={styles.ordersContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Order Management</h1>
          <p>Filter, fulfill, inspect, and transition customer industrial tool orders.</p>
        </div>

        <div className={styles.totalCountBadge}>
          <span>{totalCount} Total Orders</span>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterSelectGroup}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by order status"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="Draft">Draft</option>
            <option value="PendingPayment">Pending Payment</option>
            <option value="Paid">Paid</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by payment status"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by date range"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetFilters}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={36} className="animate-spin" color="#F5C710" />
            <h3>Loading Orders...</h3>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={40} color="#DC2626" />
            <h3>Failed to Load Orders</h3>
            <p>{error}</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={fetchOrders}
              style={{ marginTop: '8px' }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.stateBox}>
            <ShoppingCart size={48} color="#94A3B8" />
            <h3>No Orders Found</h3>
            <p>No orders match the current search and filter criteria.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className={styles.orderNumCell}>
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          style={{ color: '#0F172A', textDecoration: 'none' }}
                        >
                          {ord.order_number}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.customerBlock}>
                          <span className={styles.name}>{ord.customerName}</span>
                          {ord.customerPhone && (
                            <span className={styles.phone}>{ord.customerPhone}</span>
                          )}
                        </div>
                      </td>
                      <td>{ord.itemCount} item{ord.itemCount !== 1 ? 's' : ''}</td>
                      <td className={styles.amountCell}>₹{formatPrice(ord.total_amount)}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(ord.payment_status)}`}
                        >
                          {ord.payment_status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(ord.status)}`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '12px' }}>
                        {formatDate(ord.created_at || ord.placed_at)}
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <Link
                            href={`/admin/orders/${ord.id}`}
                            className={styles.viewBtn}
                            title="View Full Order Details"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>

                          <select
                            className={styles.statusSelect}
                            defaultValue=""
                            onChange={(e) => {
                              handleQuickStatusChange(ord.id, e.target.value);
                              e.target.value = '';
                            }}
                            aria-label="Change status"
                          >
                            <option value="" disabled>Status...</option>
                            <option value="Paid">Mark Paid</option>
                            <option value="Packed">Mark Packed</option>
                            <option value="Shipped">Mark Shipped</option>
                            <option value="Delivered">Mark Delivered</option>
                            <option value="Cancelled">Cancel Order</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationBar}>
              <div>
                Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} orders)
              </div>

              <div className={styles.pageControls}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageIndicator}>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
