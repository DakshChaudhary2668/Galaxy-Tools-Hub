'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Boxes,
  Users,
  TicketPercent,
  BarChart3,
  Settings,
  ExternalLink,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import styles from './AdminLayout.module.scss';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'COMMERCE',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Coupons', href: '/admin/coupons', icon: TicketPercent }
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings }
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive active breadcrumb label
  const getActiveTitle = () => {
    if (!pathname || pathname === '/admin' || pathname === '/admin/dashboard') {
      return 'Dashboard';
    }
    const segments = pathname.replace('/admin/', '').split('/');
    return segments[0].replace('-', ' ');
  };

  const activeTitle = getActiveTitle();

  return (
    <div className={styles.adminShell}>
      {/* Mobile Drawer Overlay */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.active : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}
        aria-label="Admin Navigation Sidebar"
      >
        {/* Header / Brand */}
        <div className={styles.sidebarHeader}>
          <Link href="/admin/dashboard" className={styles.logo} onClick={() => setMobileOpen(false)}>
            <div className={styles.logoIcon}>G</div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>Galaxy Tools</span>
              <span className={styles.portalTag}>Admin Hub</span>
            </div>
          </Link>
          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className={styles.navContainer}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <div className={styles.sectionTitle}>{section.title}</div>
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  item.href === '/admin/dashboard'
                    ? pathname === '/admin' || pathname === '/admin/dashboard'
                    : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <IconComponent size={17} className={styles.navIcon} />
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.navLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} className={styles.navIcon} />
            <span className={styles.navLabel}>View Store</span>
          </Link>
          <Link href="/sign-in" className={styles.navLink}>
            <LogOut size={16} className={styles.navIcon} />
            <span className={styles.navLabel}>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.mobileToggleBtn}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation sidebar"
            >
              <Menu size={20} />
            </button>

            <div className={styles.breadcrumbs}>
              <Link href="/admin/dashboard" className={styles.crumbRoot}>
                Admin
              </Link>
              <ChevronRight size={14} className={styles.crumbDivider} />
              <span className={styles.crumbActive}>{activeTitle}</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Quick search... (Ctrl+K)"
                aria-label="Admin search"
                readOnly
              />
            </div>

            <button
              type="button"
              className={styles.notificationBtn}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className={styles.notiDot} />
            </button>

            <div className={styles.adminProfile}>
              <div className={styles.avatar}>A</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Administrator</span>
                <span className={styles.userRole}>Store Owner</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
