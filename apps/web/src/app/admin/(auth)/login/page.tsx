'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminMe } from '@/services/auth.service';
import styles from '@/app/(auth)/Auth.module.scss';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signInWithPassword, signOut } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await signInWithPassword({ email, password });
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid credentials');
        setIsSubmitting(false);
        return;
      }

      // Verify admin authorization
      const adminRes = await getAdminMe().catch(() => null);
      const userRole = adminRes && 'role' in adminRes ? (adminRes.role as string).toUpperCase() : null;
      const hasAdminRole = userRole && ['OWNER', 'MANAGER', 'STAFF', 'ADMIN'].includes(userRole);

      if (!hasAdminRole) {
        await signOut();
        setErrorMsg('Access Denied: You do not have administrative staff permissions.');
        setIsSubmitting(false);
        return;
      }

      // Smooth, single client-side navigation to dashboard
      router.push('/admin/dashboard');
    } catch {
      setErrorMsg('An unexpected error occurred during admin sign-in.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge} style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#F87171' }}>
            <ShieldAlert size={14} />
            <span>Internal Access Only</span>
          </div>
          <h1>Admin Control Center</h1>
          <p>Restricted access portal for authorized store administrators and operators.</p>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="admin-email">Admin Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@galaxytools.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="admin-password">Master Key / Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="admin-password"
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
