import React from 'react';

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Order Received - #{orderId}</h1>
      <p>Your payment verification is pending admin review. Tracking updates will be sent once confirmed.</p>
    </div>
  );
}
