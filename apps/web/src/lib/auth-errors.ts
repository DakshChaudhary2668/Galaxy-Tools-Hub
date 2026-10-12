type AuthFailure = { code?: string } | null | undefined;

const messages: Record<string, string> = {
  email_address_invalid: 'Enter a valid email address.',
  email_address_not_authorized: 'Email delivery is not available yet. Please contact support.',
  email_not_confirmed: 'Confirm your email before signing in.',
  invalid_credentials: 'Invalid email or password.',
  over_request_rate_limit: 'Too many attempts. Please wait a few minutes and try again.',
  otp_expired: 'This link has expired. Request a new email and try again.',
  same_password: 'Choose a password you have not used for this account.',
  signup_disabled: 'New account registration is temporarily unavailable.',
  user_banned: 'This account is unavailable. Please contact support.',
  validation_failed: 'Enter a valid email address and password.',
  weak_password: 'Use at least 8 characters with a mix of letters and numbers.',
};

export function authErrorMessage(error: AuthFailure, fallback: string): string {
  return error?.code ? messages[error.code] || fallback : fallback;
}
