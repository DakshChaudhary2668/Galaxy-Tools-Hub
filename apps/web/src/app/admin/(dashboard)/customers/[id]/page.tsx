'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  IndianRupee,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import {
  getAdminCustomerById,
  toggleCustomerStatus,
  AdminCustomerDetail
} from '@/services/customer.service';
import styles from './CustomerDetail.module.scss';

export default function AdminCustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = use(params);

  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCustomerById(customerId);
      if (res) {
        setDetail(res);
      } else {
        setError('Customer record could not be found.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve customer details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleToggleStatus = async () => {
    if (!detail) return;
    setToggling(true);
    try {
      await toggleCustomerStatus(detail.profile.id, !detail.profile.is_active);
      setFeedback(`Customer status changed to ${!detail.profile.is_active ? 'Active' : 'Inactive'}.`);
      await fetchCustomerData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      alert(`Error: ${msg}`);
    } finally {
      setToggling(false);
    }
  };

  const formatPrice = (amount?: number | null) =>
    new Intl.NumberFormat('en-IN').format(amount || 0);

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

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <Loader2 size={40} className="animate-spin" color="#F5C710" />
        <h3>Loading Customer Profile...</h3>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className={styles.stateBox}>
        <AlertCircle size={48} color="#DC2626" />
        <h3>Customer Not Found</h3>
        <p>{error || 'The requested customer account does not exist.'}</p>
        <Link href="/admin/customers" className={styles.viewBtn} style={{ marginTop: '12px' }}>
          <ArrowLeft size={15} />
          <span>Return to Customers</span>
        </Link>
      </div>
    );
  }

  const { profile, stats, orders, addresses } = detail;

  return (
    <div className={styles.detailContainer}>
      {/* Header */}
      <div className={styles.topNavRow}>
        <div className={styles.leftGroup}>
          <Link href="/admin/customers" className={styles.backBtn}>
            <ArrowLeft size={14} />
            <span>Customers</span>
          </Link>
          <h1>{profile.full_name}</h1>
          <span className={`${styles.badge} ${profile.is_active ? styles.active : styles.inactive}`}>
            {profile.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className={styles.actionBtns}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${profile.is_active ? styles.deactivate : styles.activate}`}
            onClick={handleToggleStatus}
            disabled={toggling}
          >
            {profile.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
            <span>{profile.is_active ? 'Deactivate Account' : 'Activate Account'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
          {feedback}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <ShoppingBag size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.label}>Lifetime Orders</span>
            <span className={styles.value}>{stats.total_orders}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <IndianRupee size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.label}>Total Spent</span>
            <span className={styles.value}>₹{formatPrice(stats.total_spent)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.label}>Avg Order Value</span>
            <span className={styles.value}>₹{formatPrice(stats.average_order_value)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.label}>Last Purchase</span>
            <span className={styles.value} style={{ fontSize: '15px' }}>
              {formatDate(stats.last_order_at)}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Order History */}
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <ShoppingBag size={17} />
                <span>Customer Order History ({orders.length})</span>
              </h2>
            </div>

            {orders.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
                This customer has not placed any orders yet.
              </p>
            ) : (
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>
                        {ord.order_number}
                      </td>
                      <td style={{ color: '#64748B', fontSize: '12px' }}>
                        {formatDate(ord.created_at || ord.placed_at)}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${ord.payment_status === 'PAID' ? styles.paid : styles.pending}`}>
                          {ord.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: '#F1F5F9', color: '#0F172A' }}>
                          {ord.status}
                        </span>
                      </td>
                      <td className={styles.amountCell}>
                        ₹{formatPrice(ord.total_amount)}
                      </td>
                      <td>
                        <Link href={`/admin/orders/${ord.id}`} className={styles.viewBtn}>
                          <Eye size={12} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Profile & Addresses */}
        <div className={styles.sideCol}>
          {/* Profile Card */}
          <div className={styles.card}>
            <div className={styles.profileAvatarBox}>
              <div className={styles.bigAvatar}>
                {getInitials(profile.full_name)}
              </div>
              <div className={styles.profileTitle}>
                <span className={styles.name}>{profile.full_name}</span>
                <span className={styles.status} style={{ color: profile.is_active ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                  ● {profile.is_active ? 'Active Buyer' : 'Suspended / Inactive'}
                </span>
              </div>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email Address</span>
                <span className={styles.infoValue}>{profile.email}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone Number</span>
                <span className={styles.infoValue}>{profile.phone || 'Not provided'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Registered On</span>
                <span className={styles.infoValue}>{formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Stored Addresses */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <MapPin size={17} />
                <span>Saved Addresses ({addresses.length})</span>
              </h2>
            </div>

            {addresses.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
                No delivery addresses recorded yet.
              </p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className={styles.addressBox}>
                  <div className={styles.addrHeader}>
                    <span>{addr.address_label || 'Address'}</span>
                    {addr.is_default && (
                      <span style={{ fontSize: '10px', color: '#16A34A', textTransform: 'uppercase' }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div className={styles.addrText}>
                    <strong>{addr.full_name}</strong> ({addr.phone})<br />
                    {addr.address_line_1}
                    {addr.address_line_2 && `, ${addr.address_line_2}`}
                    <br />
                    {addr.city}, {addr.state} — {addr.postal_code}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
