'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';
import {
  getAdminCustomers,
  toggleCustomerStatus,
  AdminCustomerListItem
} from '../../../services/customer.service';
import styles from './Customers.module.scss';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCustomers({
        page,
        limit: 20,
        search: debouncedSearch,
        status: statusFilter,
        filter: typeFilter
      });

      if (res && res.data) {
        setCustomers(res.data);
        setTotalCount(res.meta?.total || res.data.length);
        setTotalPages(res.meta?.totalPages || 1);
      } else {
        setCustomers([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve customers.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleToggleActive = async (cust: AdminCustomerListItem) => {
    try {
      await toggleCustomerStatus(cust.id, !cust.is_active);
      setActionNotice({
        type: 'success',
        message: `Customer "${cust.full_name}" is now ${!cust.is_active ? 'Active' : 'Inactive'}.`
      });
      fetchCustomers();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update customer status.';
      alert(`Error: ${msg}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPage(1);
  };

  const formatPrice = (amount?: number | null) =>
    new Intl.NumberFormat('en-IN').format(amount || 0);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={styles.customersContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Customer Management</h1>
          <p>Monitor verified buyers, order frequencies, and lifetime industrial purchase value.</p>
        </div>

        <div className={styles.totalCountBadge}>
          <span>{totalCount} Total Customers</span>
        </div>
      </div>

      {actionNotice && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
          {actionNotice.message}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
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
            aria-label="Filter by customer status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by customer tier"
          >
            <option value="all">All Customers</option>
            <option value="high_value">High-Value (₹10,000+)</option>
            <option value="new">New Buyers (Last 30 Days)</option>
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

      {/* Customers Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={36} className="animate-spin" color="#F5C710" />
            <h3>Loading Customer Records...</h3>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={40} color="#DC2626" />
            <h3>Failed to Load Customers</h3>
            <p>{error}</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={fetchCustomers}
              style={{ marginTop: '8px' }}
            >
              <RotateCcw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className={styles.stateBox}>
            <Users size={48} color="#94A3B8" />
            <h3>No Customer Accounts Found</h3>
            <p>No customer profiles match the specified filters.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.customersTable}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <div className={styles.customerCell}>
                          <div className={styles.avatar}>
                            {getInitials(cust.full_name)}
                          </div>
                          <div className={styles.details}>
                            <Link href={`/admin/customers/${cust.id}`} className={styles.name}>
                              {cust.full_name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#475569', fontSize: '12px' }}>{cust.email}</td>
                      <td style={{ color: '#475569', fontSize: '12px' }}>{cust.phone || '-'}</td>
                      <td>
                        <span className={styles.ordersCountBadge}>
                          <ShoppingBag size={12} />
                          <span>{cust.orders_count} orders</span>
                        </span>
                      </td>
                      <td className={styles.amountCell}>₹{formatPrice(cust.total_spent)}</td>
                      <td style={{ color: '#64748B', fontSize: '12px' }}>
                        {formatDate(cust.last_order_at)}
                      </td>
                      <td style={{ color: '#64748B', fontSize: '12px' }}>
                        {formatDate(cust.created_at)}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${cust.is_active ? styles.active : styles.inactive}`}>
                          {cust.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <Link
                            href={`/admin/customers/${cust.id}`}
                            className={`${styles.actionBtn} ${styles.view}`}
                            title="View Customer Profile & Order History"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </Link>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.toggle}`}
                            onClick={() => handleToggleActive(cust)}
                            title={cust.is_active ? 'Deactivate Customer' : 'Activate Customer'}
                          >
                            {cust.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          </button>
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
                Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} customers)
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
