'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authErrorMessage } from '@/lib/auth-errors';
import styles from '../Auth.module.scss';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();
  const [linkError, setLinkError] = useState('');
  const [linkChecked, setLinkChecked] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get('error_code') || new URLSearchParams(window.location.search).get('error_code');
    if (code) setLinkError(authErrorMessage({ code }, 'This confirmation link is invalid.'));
    setLinkChecked(true);
  }, []);

  useEffect(() => {
    if (linkChecked && !linkError && !isLoading && !isAuthenticated) router.replace('/sign-in?redirect=/account');
  }, [isAuthenticated, isLoading, linkChecked, linkError, router]);

  if (linkError) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.errorBanner} role="alert"><AlertCircle size={16} /><span>{linkError}</span></div>
          <div className={styles.footerLinks}><Link href="/sign-in">Return to sign in</Link></div>
        </div>
      </div>
    );
  }

  if (!linkChecked || isLoading || !isAuthenticated) {
    return <div className={styles.authContainer}><Loader2 className="animate-spin" aria-label="Loading account" /></div>;
  }

  const name = profile && ('full_name' in profile ? profile.full_name : profile.fullName);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge}><ShieldCheck size={14} /><span>Galaxy Tools Hub</span></div>
          <h1>{name || 'Your account'}</h1>
          <p>{user?.email}</p>
        </div>
        <div className={styles.successBanner} role="status">Your account is confirmed and ready.</div>
        <button type="button" className={styles.submitBtn} onClick={async () => { await signOut(); router.replace('/'); }}>Sign out</button>
        <div className={styles.footerLinks}><Link href="/">Return to storefront</Link></div>
      </div>
    </div>
  );
}
