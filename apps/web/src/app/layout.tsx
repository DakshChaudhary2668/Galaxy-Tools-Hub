import React from 'react';
import './globals.scss';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galaxy Tools Hub | Heavy Duty Industrial Equipment',
  description: 'Enterprise grade tools, power machinery, safety gear, and industrial equipment.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header className="industrial-nav">
            <div className="brand">GALAXY TOOLS HUB</div>
            <ul className="nav-links">
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/brands">Brands</a></li>
              <li><a href="/cart">Cart</a></li>
              <li><a href="/admin/dashboard">Admin</a></li>
            </ul>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
