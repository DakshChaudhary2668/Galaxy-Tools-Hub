'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Boxes,
  Users,
  BarChart3,
  Settings,
  TicketPercent,
  ExternalLink,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
      { label: 'Coupons', href: '/admin/coupons', icon: TicketPercent },
      { label: 'Customers', href: '/admin/customers', icon: Users }
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

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, role, user, signOut, isAdmin, isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace('/admin/login');
    }
  }, [isLoading, isAdmin, isAuthenticated, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  // Derive active breadcrumb label
  const getActiveTitle = () => {
    if (!pathname || pathname === '/admin' || pathname === '/admin/dashboard') {
      return 'Dashboard';
    }
    const segments = pathname.replace('/admin/', '').split('/');
    return segments[0].replace('-', ' ');
  };

  const activeTitle = getActiveTitle();
  const displayName = adminUser?.name || user?.email?.split('@')[0] || 'Administrator';
  const displayRole = role ? (role === 'OWNER' ? 'Store Owner' : role === 'MANAGER' ? 'Operations Manager' : 'Store Staff') : 'Store Administrator';
  const initial = displayName.charAt(0).toUpperCase();

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#94A3B8' }}>
        <Loader2 className="animate-spin" size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className={styles.adminShell}>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className={`${styles.mobileOverlay} ${styles.active}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <Link href="/admin/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>G</div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>GALAXY</span>
              <span className={styles.portalTag}>ADMIN</span>
            </div>
          </Link>
          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section List */}
        <nav className={styles.navContainer} aria-label="Admin navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <span className={styles.sectionTitle}>{section.title}</span>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} className={styles.navIcon} />
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
          <button type="button" onClick={handleLogout} className={styles.navLink} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut size={16} className={styles.navIcon} />
            <span className={styles.navLabel}>Logout</span>
          </button>
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
              <div className={styles.avatar}>{initial}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{displayRole}</span>
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
