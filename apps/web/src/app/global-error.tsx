'use client';

import React from 'react';

// global-error.tsx wraps the root layout itself.
// It must include its own <html><body> because layout.tsx won't render.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            Application Error
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {error.message || 'A critical error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              background: '#111',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
