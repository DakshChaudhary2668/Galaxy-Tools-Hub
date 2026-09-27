'use client';

import React from 'react';
import Link from 'next/link';

export default function Error({
  error,
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
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: 'inherit',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#666', marginBottom: '24px', maxWidth: '400px' }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            background: '#111',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: '10px 24px',
            background: 'transparent',
            color: '#111',
            border: '1px solid #ddd',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
