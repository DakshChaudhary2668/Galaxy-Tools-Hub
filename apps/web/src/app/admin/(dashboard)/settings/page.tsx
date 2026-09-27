'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  SlidersHorizontal,
  CreditCard,
  Bell,
  Users,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Server,
  Building2
} from 'lucide-react';
import {
  getStoreSettings,
  updateStoreSettings,
  getAdminTeamUsers,
  StoreSettingsData,
  AdminTeamUser
} from '@/services/settings.service';
import styles from './Settings.module.scss';

type SettingsTab = 'general' | 'commerce' | 'payments' | 'notifications' | 'team' | 'security';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [adminTeam, setAdminTeam] = useState<AdminTeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Editable Form States
  const [storeName, setStoreName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [supportHours, setSupportHours] = useState('');

  const [currency, setCurrency] = useState('INR (₹)');
  const [defaultGSTRate, setDefaultGSTRate] = useState(18);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50000);
  const [flatShippingFee, setFlatShippingFee] = useState(500);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [orderEmail, setOrderEmail] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, teamRes] = await Promise.allSettled([
        getStoreSettings(),
        getAdminTeamUsers()
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const s = settingsRes.value;
        setSettings(s);
        setStoreName(s.general.storeName || '');
        setBusinessName(s.general.businessName || '');
        setBusinessEmail(s.general.businessEmail || '');
        setSupportPhone(s.general.supportPhone || '');
        setAddress(s.general.address || '');
        setGstin(s.general.gstin || '');
        setSupportHours(s.general.supportHours || '');

        setCurrency(s.commerce.currency || 'INR (₹)');
        setDefaultGSTRate(s.commerce.defaultGSTRate ?? 18);
        setFreeShippingThreshold(s.commerce.freeShippingThreshold ?? 50000);
        setFlatShippingFee(s.commerce.flatShippingFee ?? 500);
        setLowStockThreshold(s.commerce.lowStockThreshold ?? 5);

        setOrderEmail(Boolean(s.notifications.orderConfirmationEmail));
        setLowStockAlert(Boolean(s.notifications.adminLowStockAlerts));
        setDailyDigest(Boolean(s.notifications.dailySummaryDigest));
      }

      if (teamRes.status === 'fulfilled' && teamRes.value) {
        setAdminTeam(teamRes.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve configuration.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const payload = {
        general: {
          storeName,
          businessName,
          businessEmail,
          supportPhone,
          address,
          gstin,
          supportHours
        },
        commerce: {
          currency,
          defaultGSTRate: Number(defaultGSTRate),
          freeShippingThreshold: Number(freeShippingThreshold),
          flatShippingFee: Number(flatShippingFee),
          lowStockThreshold: Number(lowStockThreshold),
          minimumOrderQuantity: 1
        },
        notifications: {
          orderConfirmationEmail: orderEmail,
          adminLowStockAlerts: lowStockAlert,
          dailySummaryDigest: dailyDigest,
          smsNotifications: false
        }
      };

      await updateStoreSettings(payload);
      setFeedback('Configuration updated successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className={styles.stateBox}>
        <Loader2 size={40} className="animate-spin" color="#F5C710" />
        <h3>Loading System Configuration...</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className={styles.settingsContainer}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Admin Settings & Operations</h1>
          <p>Configure store profile, commerce parameters, payment keys, and RBAC governance.</p>
        </div>

        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {feedback && (
        <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className={styles.layoutGrid}>
        {/* Left Navigation Card */}
        <div className={styles.navCard}>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Store size={16} />
            <span>Store Profile</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'commerce' ? styles.active : ''}`}
            onClick={() => setActiveTab('commerce')}
          >
            <SlidersHorizontal size={16} />
            <span>Commerce & Tax</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'payments' ? styles.active : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard size={16} />
            <span>Payment Gateway</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'team' ? styles.active : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={16} />
            <span>Admin Users</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={16} />
            <span>System & Security</span>
          </button>
        </div>

        {/* Right Settings Content Panel */}
        <div className={styles.contentCard}>
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  <Store size={18} />
                  <span>General Store Information</span>
                </h2>
                <p>Public business profile, communication contacts, and registered GST credentials.</p>
              </div>

              <div className={styles.formSection}>
                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="sName">Store Front Name</label>
                    <input
                      id="sName"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bName">Legal Entity Name</label>
                    <input
                      id="bName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="bEmail">Official Support Email</label>
                    <input
                      id="bEmail"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="sPhone">Support Helpline Phone</label>
                    <input
                      id="sPhone"
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="gstin">GSTIN / Tax ID</label>
                    <input
                      id="gstin"
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="sHours">Support Working Hours</label>
                    <input
                      id="sHours"
                      type="text"
                      value={supportHours}
                      onChange={(e) => setSupportHours(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addr">Registered Warehouse & Office Address</label>
                  <textarea
                    id="addr"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: COMMERCE */}
          {activeTab === 'commerce' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  <SlidersHorizontal size={18} />
                  <span>Commerce, Shipping & Tax Defaults</span>
                </h2>
                <p>Configure tax brackets, warehouse reorder alerts, and shipping logistics.</p>
              </div>

              <div className={styles.formSection}>
                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="curr">Default Store Currency</label>
                    <input id="curr" type="text" value={currency} disabled />
                    <span className={styles.hint}>Currency is locked to INR for India domestic trade.</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="gstRate">Standard GST Tax Rate (%)</label>
                    <input
                      id="gstRate"
                      type="number"
                      value={defaultGSTRate}
                      onChange={(e) => setDefaultGSTRate(Number(e.target.value))}
                      min="0"
                      max="28"
                    />
                    <span className={styles.hint}>Standard HSN 9030 testing instruments GST is 18%.</span>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="freeShip">Free Shipping Threshold (₹)</label>
                    <input
                      id="freeShip"
                      type="number"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                      min="0"
                    />
                    <span className={styles.hint}>Orders at or above this subtotal qualify for complimentary dispatch.</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="flatShip">Standard Flat Shipping Fee (₹)</label>
                    <input
                      id="flatShip"
                      type="number"
                      value={flatShippingFee}
                      onChange={(e) => setFlatShippingFee(Number(e.target.value))}
                      min="0"
                    />
                    <span className={styles.hint}>Applied on orders below the free shipping threshold.</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lowThresh">Global Low Stock Alert Level (Units)</label>
                  <input
                    id="lowThresh"
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    min="1"
                  />
                  <span className={styles.hint}>Items reaching this quantity trigger dashboard inventory warnings.</span>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  <CreditCard size={18} />
                  <span>Payment Gateway Integration</span>
                </h2>
                <p>Verified status for online payments and B2B wire transfers.</p>
              </div>

              {settings?.payment && (
                <div className={styles.gatewayCard}>
                  <div className={styles.gwHeader}>
                    <div className={styles.gwTitle}>
                      <CreditCard size={18} />
                      <span>Razorpay Payment Gateway</span>
                    </div>
                    <span className={`${styles.badge} ${settings.payment.mode === 'LIVE_MODE' ? styles.live : styles.test}`}>
                      {settings.payment.mode}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span>Gateway Integration Status:</span>
                    <strong style={{ color: settings.payment.isConfigured ? '#16A34A' : '#DC2626' }}>
                      {settings.payment.isConfigured ? 'Active & Ready' : 'Credentials Incomplete'}
                    </strong>
                  </div>

                  <div className={styles.infoRow}>
                    <span>Public Key ID:</span>
                    <code>{settings.payment.keyIdMasked}</code>
                  </div>
                </div>
              )}

              <div className={styles.securityBanner}>
                <Lock size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div className={styles.bannerText}>
                  <strong>Zero-Trust Secret Isolation</strong>
                  <p>
                    Razorpay Secret Keys, Webhook Secrets, and Database credentials are kept strictly server-side in secure environment variables. They are never rendered or transmitted to browser clients.
                  </p>
                </div>
              </div>

              <div className={styles.gatewayCard}>
                <div className={styles.gwHeader}>
                  <div className={styles.gwTitle}>
                    <Building2 size={18} />
                    <span>B2B Bank Transfer / NEFT Details</span>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <span>Beneficiary Name:</span>
                  <strong>{settings?.payment.neftAccountName}</strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Account Number:</span>
                  <code>{settings?.payment.neftAccountNumber}</code>
                </div>

                <div className={styles.infoRow}>
                  <span>IFSC Code:</span>
                  <code>{settings?.payment.neftIfscCode}</code>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  <Bell size={18} />
                  <span>Notification & Alert Policies</span>
                </h2>
                <p>Configure automated emails, customer order confirmations, and ops digests.</p>
              </div>

              <div className={styles.formSection}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <strong>Buyer Order Confirmation Emails</strong>
                    <span>Automatically email verified tax invoice receipts upon payment capture.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={orderEmail}
                    onChange={(e) => setOrderEmail(e.target.checked)}
                  />
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <strong>Admin Low-Stock Inventory Alerts</strong>
                    <span>Send notifications when tool stock drops below critical threshold.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.checked)}
                  />
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <strong>Daily Operational Digest</strong>
                    <span>Deliver summary of daily order volume and fulfillment tasks to admin team.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={(e) => setDailyDigest(e.target.checked)}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 5: ADMIN TEAM */}
          {activeTab === 'team' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  <Users size={18} />
                  <span>Authorized Admin Team</span>
                </h2>
                <p>Internal users with access to Galaxy Tools Hub store management.</p>
              </div>

              <table className={styles.teamTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminTeam.map((member) => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{member.name}</td>
                      <td style={{ color: '#475569', fontSize: '12px' }}>{member.email}</td>
                      <td>
                        <span className={`${styles.badge} ${member.role === 'OWNER' ? styles.owner : styles.manager}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.active}`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* TAB 6: SECURITY */}
          {activeTab === 'security' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  <Shield size={18} />
                  <span>System Architecture & Security Posture</span>
                </h2>
                <p>Live health and configuration parameters across the stack.</p>
              </div>

              <div className={styles.gatewayCard}>
                <div className={styles.gwHeader}>
                  <div className={styles.gwTitle}>
                    <Server size={18} />
                    <span>Server & Database Runtime</span>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <span>Environment Mode:</span>
                  <code>{settings?.system.environment}</code>
                </div>

                <div className={styles.infoRow}>
                  <span>REST API Version:</span>
                  <code>{settings?.system.apiVersion}</code>
                </div>

                <div className={styles.infoRow}>
                  <span>Database Connection:</span>
                  <strong style={{ color: '#16A34A' }}>{settings?.system.database}</strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Authentication Engine:</span>
                  <span>{settings?.system.authSystem}</span>
                </div>

                <div className={styles.infoRow}>
                  <span>Asset Storage Bucket:</span>
                  <code>{settings?.system.storageSystem}</code>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
