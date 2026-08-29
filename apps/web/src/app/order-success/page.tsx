'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  MapPin,
  Printer,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Truck
} from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import { apiClient } from '../../services/api';
import styles from './OrderSuccess.module.scss';

interface OrderItem {
  id?: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface OrderAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  placedAt: string;
  customerNotes?: string;
  address?: OrderAddress | null;
  items: OrderItem[];
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No Order ID was provided.');
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await apiClient.get<{ data: OrderDetails }>(`/payments/order-status/${orderId}`);
        if (res?.data) {
          setOrder(res.data);
        } else {
          setError('Order details could not be retrieved.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to verify order details.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-IN').format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <Loader2 size={48} className="animate-spin" color="#F5C710" />
        <h2>Verifying Order Confirmation...</h2>
        <p>Please wait while we retrieve your verified order details from the server.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.stateCard}>
        <AlertTriangle size={56} color="#DC2626" />
        <h2>Unable to Verify Order</h2>
        <p>{error || 'We could not find a confirmed order with the specified ID.'}</p>
        <div className={styles.actionRow} style={{ marginTop: '16px' }}>
          <Link href="/checkout" className={styles.primaryBtn}>
            <span>Return to Checkout</span>
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.successCard}>
      {/* Banner */}
      <div className={styles.headerBanner}>
        <div className={styles.iconCircle}>
          <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <h1>Order Placed Successfully</h1>
        <p>
          Thank you for choosing Galaxy Tools Hub. Your transaction has been verified and your order is now being processed.
        </p>
      </div>

      {/* Quick Summary Bar */}
      <div className={styles.statusQuickBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Order Number</span>
          <span className={styles.statValue}>{order.orderNumber}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Date & Time</span>
          <span className={styles.statValue}>{formatDate(order.placedAt)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Payment Status</span>
          <span className={`${styles.statValue} ${styles.paidTag}`}>
            {order.paymentStatus === 'PAID' ? 'PAID (Razorpay)' : order.paymentStatus}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Paid</span>
          <span className={styles.statValue}>₹{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        {/* Delivery & Dispatch Notice */}
        <div className={styles.dispatchNotice}>
          <Truck size={20} />
          <span>
            Standard Insured Dispatch: Dispatches in 24–48 business hours. Full GST Tax Invoice with ITC details included in shipment.
          </span>
        </div>

        {/* Shipping Address */}
        {order.address && (
          <div className={styles.section}>
            <h3>
              <MapPin size={16} />
              <span>Delivery Address</span>
            </h3>
            <div className={styles.infoBox}>
              <div className={styles.infoGroup}>
                <span className={styles.infoTitle}>Recipient</span>
                <span className={styles.infoContent}>
                  {order.address.full_name} ({order.address.phone})
                </span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoTitle}>Address</span>
                <span className={styles.infoContent}>
                  {order.address.address_line_1}
                  {order.address.address_line_2 && `, ${order.address.address_line_2}`}
                  <br />
                  {order.address.city}, {order.address.state} — {order.address.postal_code}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Purchased Items */}
        {order.items && order.items.length > 0 && (
          <div className={styles.section}>
            <h3>
              <Package size={16} />
              <span>Ordered Instruments ({order.items.length})</span>
            </h3>
            <div className={styles.itemsTable}>
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemName}>{item.product_name}</span>
                    {item.sku && <span className={styles.itemSku}>SKU: {item.sku}</span>}
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemQty}>Qty: {item.quantity}</span>
                    <span className={styles.itemPrice}>₹{formatPrice(item.total_amount || item.unit_price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className={styles.totalsBox}>
          <div className={styles.totalLine}>
            <span>Subtotal</span>
            <span>₹{formatPrice(order.subtotal)}</span>
          </div>
          <div className={styles.totalLine}>
            <span>GST (18% Included)</span>
            <span>₹{formatPrice(order.taxAmount)}</span>
          </div>
          <div className={styles.totalLine}>
            <span>Shipping</span>
            <span>{order.shippingAmount === 0 ? 'FREE' : `₹${formatPrice(order.shippingAmount)}`}</span>
          </div>
          <div className={`${styles.totalLine} ${styles.grandTotal}`}>
            <span>Grand Total</span>
            <span>₹{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => window.print()}
          >
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
          <Link href="/" className={styles.primaryBtn}>
            <span>Continue Shopping</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        <Suspense
          fallback={
            <div className={styles.stateCard}>
              <Loader2 size={48} className="animate-spin" color="#F5C710" />
              <h2>Loading Order Confirmation...</h2>
            </div>
          }
        >
          <OrderSuccessContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
