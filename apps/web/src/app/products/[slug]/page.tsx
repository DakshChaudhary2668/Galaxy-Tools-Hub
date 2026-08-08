import React from 'react';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Product Specification: {slug}</h1>
      <p>Technical specifications, HSN code, GST rate, stock availability.</p>
    </div>
  );
}
