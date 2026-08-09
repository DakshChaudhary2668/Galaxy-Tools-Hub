// Galaxy Tools Hub API — base fetch client
// Attach Clerk JWT token to every request.
// Usage: import { apiClient } from '@/services/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

type RequestOptions = RequestInit & { token?: string };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
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
