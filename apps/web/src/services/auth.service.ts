import { apiClient } from './api';

// TODO: implement — GET /api/v1/auth/customer/me
export async function getCustomerMe(token: string) {
  return apiClient.get('/auth/customer/me', { token });
}

// TODO: implement — GET /api/v1/auth/admin/me
export async function getAdminMe(token: string) {
  return apiClient.get('/auth/admin/me', { token });
}
