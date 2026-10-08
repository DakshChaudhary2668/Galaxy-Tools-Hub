'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Package,
  MapPin,
  CreditCard,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw
} from 'lucide-react';
import {
  getAdminOrderById,
  updateAdminOrderStatus,
  AdminOrderDetailFull
} from '@/services/order.service';
import {
  OrderStatus,
  OrderStatusLabels,
  OrderStatusTransitions,
  OrderStatusType
} from '@galaxy/constants';
import styles from './OrderDetail.module.scss';

export default function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);

  const [detail, setDetail] = useState<AdminOrderDetailFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusType | ''>('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOrderById(orderId);
      if (res) {
        setDetail(res);
        setSelectedStatus('');
      } else {
        setError('Order details could not be found.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve order details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !detail) return;

    if (
      (selectedStatus === OrderStatus.CANCELLED || selectedStatus === OrderStatus.REFUNDED) &&
      !confirm(`Are you sure you want to transition order #${detail.order.order_number} to "${OrderStatusLabels[selectedStatus]}"? This will release reserved inventory.`)
    ) {
      return;
    }

    setUpdating(true);
    setFeedback(null);

    try {
      await updateAdminOrderStatus(orderId, selectedStatus);
      setFeedback({ type: 'success', message: `Order status successfully updated to ${OrderStatusLabels[selectedStatus]}` });
      await fetchOrder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (amount?: number) =>
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

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('paid')) return styles.paid;
    if (s.includes('shipped')) return styles.shipped;
    if (s.includes('delivered')) return styles.delivered;
    if (s.includes('cancel')) return styles.cancelled;
    if (s.includes('refund')) return styles.refunded;
    return styles.pending;
  };

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <Loader2 size={40} className="animate-spin" color="#F5C710" />
        <h3>Loading Order #{orderId.slice(0, 8)}...</h3>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className={styles.stateBox}>
        <AlertCircle size={48} color="#DC2626" />
        <h3>Order Not Found</h3>
        <p>{error || 'The requested order record could not be loaded.'}</p>
        <Link href="/admin/orders" className={styles.backBtn} style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} />
          <span>Return to Orders List</span>
        </Link>
      </div>
    );
  }

  const { order, items, address, payment } = detail;
  const nextAllowed = OrderStatusTransitions[order.status] || [];

  return (
    <div className={styles.detailContainer}>
      {/* Top Bar */}
      <div className={styles.topNavRow}>
        <div className={styles.leftGroup}>
          <Link href="/admin/orders" className={styles.backBtn}>
            <ArrowLeft size={14} />
            <span>Orders</span>
          </Link>
          <h1>Order {order.order_number}</h1>
          <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
            {OrderStatusLabels[order.status]}
          </span>
        </div>

        <div className={styles.actionBtns}>
          <button
            type="button"
            className={styles.printBtn}
            onClick={() => window.print()}
          >
            <Printer size={15} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? '#DCFCE7' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
            color: feedback.type === 'success' ? '#16A34A' : '#991B1B',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Ordered Items & Financials */}
        <div className={styles.mainCol}>
          {/* Items Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <Package size={17} />
                <span>Ordered Instruments ({items.length})</span>
              </h2>
            </div>

            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>
                      <div className={styles.productCell}>
                        <div className={styles.itemThumb}>
                          <Package size={20} />
                        </div>
                        <div className={styles.itemDetails}>
                          <span className={styles.name}>{item.product_name}</span>
                          <span className={styles.sku}>SKU: {item.sku || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>₹{formatPrice(item.unit_price)}</td>
                    <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                    <td className={styles.amountCell}>
                      ₹{formatPrice(item.total_amount || item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Breakdown */}
            <div className={styles.summaryBox}>
              <div className={styles.summaryLine}>
                <span>Subtotal</span>
                <span>₹{formatPrice(order.subtotal)}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>GST (18%)</span>
                <span>₹{formatPrice(order.tax_amount)}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Freight / Delivery Charges</span>
                <span>₹{formatPrice(order.shipping_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className={styles.summaryLine} style={{ color: '#16A34A' }}>
                  <span>Discount</span>
                  <span>-₹{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className={`${styles.summaryLine} ${styles.grandTotal}`}>
                <span>Grand Total</span>
                <span>₹{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {order.customer_notes && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>
                  <User size={17} />
                  <span>Order Notes & Customer Info</span>
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                {order.customer_notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Status Transition + Customer + Shipping + Payment */}
        <div className={styles.sideCol}>
          {/* Order Status Transition Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <ShieldCheck size={17} />
                <span>Order Status Management</span>
              </h2>
            </div>

            <div className={styles.statusControlBox}>
              <div className={styles.currentStatusRow}>
                <span className={styles.label}>Current State:</span>
                <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                  {OrderStatusLabels[order.status]}
                </span>
              </div>

              {nextAllowed.length > 0 ? (
                <div className={styles.transitionForm}>
                  <label htmlFor="targetStatus">Transition to New State:</label>
                  <select
                    id="targetStatus"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatusType | '')}
                  >
                    <option value="">Select target state...</option>
                    {nextAllowed.map((st) => (
                      <option key={st} value={st}>
                        {OrderStatusLabels[st]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={styles.applyBtn}
                    onClick={handleStatusUpdate}
                    disabled={!selectedStatus || updating}
                  >
                    {updating ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Apply Status Change</span>
                    )}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  This order is in a terminal state ({OrderStatusLabels[order.status]}). No further transitions are allowed.
                </p>
              )}
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <MapPin size={17} />
                <span>Delivery Information</span>
              </h2>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Recipient</span>
                <span className={styles.infoValue}>
                  {address ? `${address.full_name} (${address.phone})` : 'Guest Customer'}
                </span>
              </div>

              {address && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Delivery Address</span>
                  <span className={styles.infoValue}>
                    {address.address_line_1}
                    {address.address_line_2 && `, ${address.address_line_2}`}
                    <br />
                    {address.city}, {address.state} — {address.postal_code}
                  </span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date Placed</span>
                <span className={styles.infoValue}>{formatDate(order.created_at || order.placed_at)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                <CreditCard size={17} />
                <span>Payment Verification</span>
              </h2>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Payment Status</span>
                <span className={`${styles.badge} ${getStatusBadgeClass(order.payment_status)}`}>
                  {order.payment_status}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Razorpay Order ID</span>
                <span className={styles.infoValue}>
                  {payment?.gateway_reference || 'N/A'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Transaction ID</span>
                <span className={styles.infoValue}>
                  {payment?.transaction_id || 'N/A'}
                </span>
              </div>

              {payment?.paid_at && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Paid Timestamp</span>
                  <span className={styles.infoValue}>{formatDate(payment.paid_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
