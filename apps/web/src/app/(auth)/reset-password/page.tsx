'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/auth-errors';
import { useAuth } from '@/hooks/useAuth';
import styles from '../Auth.module.scss';

export default function ResetPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get('error_code') || new URLSearchParams(window.location.search).get('error_code');
    if (code) setError(authErrorMessage({ code }, 'This password reset link is invalid.'));
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setError((current) => current || 'This password reset link is invalid or has expired.');
  }, [isAuthenticated, isLoading]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) return setError('This password reset link is invalid or has expired.');
    setError('');
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return setError(authErrorMessage(updateError, 'Unable to update the password. Please request a new link.'));
      setUpdated(true);
    } catch {
      setError('Unable to update the password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge}><ShieldCheck size={14} /><span>Galaxy Tools Hub</span></div>
          <h1>Choose a new password</h1>
          <p>Your reset link must be valid before the password can be changed.</p>
        </div>
        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
        {updated ? (
          <div className={styles.successBanner} role="status"><CheckCircle2 size={16} /><span>Password updated. Your account is ready.</span></div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">New password</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isLoading || !isAuthenticated} />
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading || isLoading || !isAuthenticated || password.length < 8}>
              {(loading || isLoading) && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Updating...' : 'Update password'}</span>
            </button>
          </form>
        )}
        <div className={styles.footerLinks}><Link href={updated ? '/account' : '/sign-in'}>{updated ? 'Go to your account' : 'Back to sign in'}</Link></div>
      </div>
    </div>
  );
}
