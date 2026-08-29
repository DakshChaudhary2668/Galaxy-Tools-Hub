'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  AdminCouponListItem
} from '../../../services/coupon.service';
import styles from './Coupons.module.scss';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCouponListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponListItem | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perCustomerLimit, setPerCustomerLimit] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCouponsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCoupons({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (res && Array.isArray(res)) {
        setCoupons(res);
      } else if (res && (res as any).data) {
        setCoupons((res as any).data);
      } else {
        setCoupons([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve coupons.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCouponsList();
  }, [fetchCouponsList]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('10');
    setMinOrderValue('0');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setPerCustomerLimit('1');
    setStartDate(new Date().toISOString().split('T')[0]);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEndDate(nextMonth.toISOString().split('T')[0]);
    setIsActive(true);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: AdminCouponListItem) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType((c.discount_type as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE');
    setDiscountValue(String(c.discount_value));
    setMinOrderValue(String(c.min_order_value || 0));
    setMaxDiscountAmount(c.max_discount_amount ? String(c.max_discount_amount) : '');
    setUsageLimit(c.usage_limit ? String(c.usage_limit) : '');
    setPerCustomerLimit(String(c.per_customer_limit || 1));
    setStartDate(c.start_date ? c.start_date.split('T')[0] : '');
    setEndDate(c.end_date ? c.end_date.split('T')[0] : '');
    setIsActive(Boolean(c.is_active));
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const normCode = code.trim().toUpperCase();
    if (!normCode) {
      setModalError('Coupon code is required.');
      return;
    }

    const val = Number(discountValue);
    if (!val || val <= 0) {
      setModalError('Discount value must be greater than 0.');
      return;
    }

    if (discountType === 'PERCENTAGE' && val > 100) {
      setModalError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setModalError('Expiry date must be after the start date.');
      return;
    }

    setModalSaving(true);

    try {
      const payload = {
        code: normCode,
        discount_type: discountType,
        discount_value: val,
        min_order_value: Number(minOrderValue) || 0,
        max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        per_customer_limit: Number(perCustomerLimit) || 1,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_active: isActive
      };

      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon.id, payload);
        setActionNotice({ type: 'success', message: `Coupon "${normCode}" updated successfully.` });
      } else {
        await createAdminCoupon(payload);
        setActionNotice({ type: 'success', message: `Coupon "${normCode}" created successfully.` });
      }

      setModalOpen(false);
      fetchCouponsList();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save coupon.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };

  const handleToggleActive = async (c: AdminCouponListItem) => {
    try {
      await updateAdminCoupon(c.id, { is_active: !c.is_active });
      setActionNotice({
        type: 'success',
        message: `Coupon "${c.code}" is now ${!c.is_active ? 'Active' : 'Disabled'}.`
      });
      fetchCouponsList();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      setActionNotice({ type: 'error', message: msg });
    }
  };

  const handleDelete = async (c: AdminCouponListItem) => {
    if (!confirm(`Are you sure you want to remove coupon "${c.code}"? If it has been used in previous orders, it will be safely archived/disabled.`)) {
      return;
    }

    try {
      const res = await deleteAdminCoupon(c.id);
      setActionNotice({
        type: 'success',
        message: res.message || `Coupon "${c.code}" processed.`
      });
      fetchCouponsList();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete coupon.';
      setActionNotice({ type: 'error', message: msg });
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
        year: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return styles.active;
      case 'SCHEDULED':
        return styles.scheduled;
      case 'EXPIRED':
        return styles.expired;
      case 'DISABLED':
      default:
        return styles.disabled;
    }
  };

  return (
    <div className={styles.couponsContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Coupon & Discount Management</h1>
          <p>Create promotional vouchers, corporate tool discounts, and seasonal offers.</p>
        </div>

        <button type="button" className={styles.primaryBtn} onClick={openCreateModal}>
          <Plus size={16} />
          <span>Create Coupon</span>
        </button>
      </div>

      {actionNotice && (
        <div
          style={{
            backgroundColor: actionNotice.type === 'success' ? '#DCFCE7' : '#FEF2F2',
            border: `1px solid ${actionNotice.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
            color: actionNotice.type === 'success' ? '#16A34A' : '#991B1B',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {actionNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterSelectGroup}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by coupon status"
          >
            <option value="all">All Coupon Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={36} className="animate-spin" color="#F5C710" />
            <h3>Loading Promotions...</h3>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={40} color="#DC2626" />
            <h3>Failed to Load Coupons</h3>
            <p>{error}</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className={styles.stateBox}>
            <Tag size={48} color="#94A3B8" />
            <h3>No Coupons Configured</h3>
            <p>Create promotional discount codes for your customers.</p>
            <button type="button" className={styles.primaryBtn} onClick={openCreateModal} style={{ marginTop: '10px' }}>
              <Plus size={16} />
              <span>Create Coupon</span>
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.couponsTable}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Max Cap</th>
                  <th>Usage</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.codeBadge}>
                        <Tag size={13} />
                        <span>{c.code}</span>
                      </div>
                    </td>
                    <td className={styles.discountCell}>
                      {c.discount_type === 'PERCENTAGE' ? (
                        <span>{c.discount_value}% OFF</span>
                      ) : (
                        <span>₹{formatPrice(c.discount_value)} FLAT</span>
                      )}
                    </td>
                    <td>
                      {c.min_order_value && c.min_order_value > 0 ? (
                        <span>₹{formatPrice(c.min_order_value)}</span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>No minimum</span>
                      )}
                    </td>
                    <td>
                      {c.max_discount_amount ? (
                        <span>₹{formatPrice(c.max_discount_amount)}</span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>No cap</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {c.usage_count} / {c.usage_limit || '∞'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748B' }}>
                      {formatDate(c.start_date)} — {formatDate(c.end_date)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.edit}`}
                          onClick={() => openEditModal(c)}
                          title="Edit Coupon"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.toggle}`}
                          onClick={() => handleToggleActive(c)}
                          title={c.is_active ? 'Disable Coupon' : 'Enable Coupon'}
                        >
                          {c.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.delete}`}
                          onClick={() => handleDelete(c)}
                          title="Delete Coupon"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Voucher'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon}>
              <div className={styles.modalBody}>
                {modalError && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={15} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cCode">Coupon Code *</label>
                    <input
                      id="cCode"
                      type="text"
                      placeholder="e.g. GALAXY10"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cType">Discount Type</label>
                    <select
                      id="cType"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cVal">
                      {discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                    </label>
                    <input
                      id="cVal"
                      type="number"
                      placeholder={discountType === 'PERCENTAGE' ? '15' : '500'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      min="1"
                      max={discountType === 'PERCENTAGE' ? '100' : undefined}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cMin">Minimum Order Value (₹)</label>
                    <input
                      id="cMin"
                      type="number"
                      placeholder="0 for no minimum"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                {discountType === 'PERCENTAGE' && (
                  <div className={styles.formGroup}>
                    <label htmlFor="cMaxCap">Max Discount Cap (₹ Optional)</label>
                    <input
                      id="cMaxCap"
                      type="number"
                      placeholder="e.g. 2000 (limits maximum percentage savings)"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      min="0"
                    />
                  </div>
                )}

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cUsage">Total Usage Limit (Optional)</label>
                    <input
                      id="cUsage"
                      type="number"
                      placeholder="e.g. 100 (Blank for unlimited)"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cCustLimit">Per Customer Limit</label>
                    <input
                      id="cCustLimit"
                      type="number"
                      value={perCustomerLimit}
                      onChange={(e) => setPerCustomerLimit(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cStart">Start Date</label>
                    <input
                      id="cStart"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cEnd">Expiry Date</label>
                    <input
                      id="cEnd"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="cActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="cActive" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Active & Redeemable
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModalOpen(false)}
                  disabled={modalSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={modalSaving}
                >
                  {modalSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>{modalSaving ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
