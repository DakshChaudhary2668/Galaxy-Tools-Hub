'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Truck
} from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import { getOrderStatus, OrderDetails } from '../../services/payment.service';
import styles from './OrderSuccess.module.scss';

// Types imported from payment.service.ts
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
        const data = await getOrderStatus(orderId as string);
        if (data) {
          setOrder(data);
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
        <h1>{order.paymentStatus === 'PAID' ? 'Order Placed Successfully' : 'Order Confirmation Processing'}</h1>
        <p>
          {order.paymentStatus === 'PAID'
            ? 'Thank you for choosing Galaxy Tools Hub. Your payment is verified and your order is being processed.'
            : 'We have your order reference. Payment confirmation can take a moment; please check this page again shortly.'}
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
          <span className={styles.statLabel}>Order Status</span>
          <span className={styles.statValue}>{order.status}</span>
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

        {/* Actions */}
        <div className={styles.actionRow}>
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
