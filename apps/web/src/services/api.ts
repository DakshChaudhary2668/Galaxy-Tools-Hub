// Galaxy Tools Hub API — base fetch client
// Attach the Supabase access token to authenticated requests.
// Usage: import { apiClient } from '@/services/api';

import { supabase } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) throw new Error('NEXT_PUBLIC_API_URL is required');

type RequestOptions = RequestInit & { token?: string };

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const authToken = token || (await getAuthToken());
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store', ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.message ?? res.statusText), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post:   <T>(path: string, body: unknown, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'PUT', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
};
