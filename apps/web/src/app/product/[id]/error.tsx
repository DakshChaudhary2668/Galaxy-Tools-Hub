'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ProductError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#111' }}>
        Product Could Not Load
      </h1>
      <p style={{ color: '#666', marginBottom: '28px', maxWidth: '420px', lineHeight: 1.6 }}>
        We had trouble loading this product. It may have been removed or the link may be incorrect.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '11px 28px',
            background: '#111',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.05em',
          }}
        >
          TRY AGAIN
        </button>
        <Link
          href="/products"
          style={{
            padding: '11px 28px',
            background: 'transparent',
            color: '#111',
            border: '1px solid #ccc',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.05em',
          }}
        >
          BROWSE CATALOG
        </Link>
      </div>
    </div>
  );
}
