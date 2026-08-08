import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      <aside style={{ width: '240px', backgroundColor: '#1E1E1E', color: '#FFF', padding: '1.5rem' }}>
        <h2 style={{ color: '#FFB800', fontSize: '1.1rem', marginBottom: '1.5rem' }}>ADMIN PANEL</h2>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <li><a href="/admin/dashboard" style={{ color: '#FFF', textDecoration: 'none' }}>Dashboard</a></li>
          <li><a href="/admin/products" style={{ color: '#FFF', textDecoration: 'none' }}>Products</a></li>
          <li><a href="/admin/categories" style={{ color: '#FFF', textDecoration: 'none' }}>Categories</a></li>
          <li><a href="/admin/brands" style={{ color: '#FFF', textDecoration: 'none' }}>Brands</a></li>
          <li><a href="/admin/orders" style={{ color: '#FFF', textDecoration: 'none' }}>Orders</a></li>
          <li><a href="/admin/customers" style={{ color: '#FFF', textDecoration: 'none' }}>Customers</a></li>
          <li><a href="/admin/invoices" style={{ color: '#FFF', textDecoration: 'none' }}>Invoices</a></li>
          <li><a href="/admin/analytics" style={{ color: '#FFF', textDecoration: 'none' }}>Analytics</a></li>
          <li><a href="/admin/settings" style={{ color: '#FFF', textDecoration: 'none' }}>Settings</a></li>
        </ul>
      </aside>
      <section style={{ flex: 1, padding: '2rem', backgroundColor: '#F4F4F5' }}>
        {children}
      </section>
    </div>
  );
}
