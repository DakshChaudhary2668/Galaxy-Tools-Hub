'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/auth-errors';
import styles from '../Auth.module.scss';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) return setError(authErrorMessage(resetError, 'Unable to send the reset email. Please try again.'));
      setSent(true);
    } catch {
      setError('Unable to send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge}><ShieldCheck size={14} /><span>Galaxy Tools Hub</span></div>
          <h1>Reset your password</h1>
          <p>We will send a secure reset link if an account exists for this email.</p>
        </div>
        {error && <div className={styles.errorBanner} role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
        {sent ? (
          <div className={styles.successBanner} role="status"><CheckCircle2 size={16} /><span>Check your inbox for the password reset link.</span></div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading || !email}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Sending...' : 'Send reset link'}</span>
            </button>
          </form>
        )}
        <div className={styles.footerLinks}><Link href="/sign-in">Back to sign in</Link></div>
      </div>
    </div>
  );
}
