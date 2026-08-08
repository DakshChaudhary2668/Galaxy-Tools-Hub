import React from 'react';

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Manual Bank Transfer - Order #{orderId}</h1>
      <p>Scan QR Code or copy bank details below to transfer funds.</p>
      <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0' }}>
        <p><strong>Bank:</strong> Industrial Trade Bank</p>
        <p><strong>Account Name:</strong> Galaxy Tools Hub Pvt Ltd</p>
        <p><strong>IFSC:</strong> ITBL0001982</p>
      </div>
      <p>Upload your payment transfer screenshot below:</p>
      <input type="file" accept="image/*" />
    </div>
  );
}
