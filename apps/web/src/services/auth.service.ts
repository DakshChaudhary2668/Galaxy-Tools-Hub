import { apiClient } from './api';
import { ApiResponse, ProfileDto, AdminUserDto } from '@galaxy/types';

export interface CustomerMeResponse {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface AdminMeResponse {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  status?: string;
}

/**
 * Retrieves the currently authenticated customer profile.
 */
export async function getCustomerMe(token?: string): Promise<ProfileDto | CustomerMeResponse | null> {
  const res = await apiClient.get<ApiResponse<ProfileDto | CustomerMeResponse>>('/auth/customer/me', { token });
  return res?.data || null;
}

/**
 * Retrieves the currently authenticated admin user record.
 */
export async function getAdminMe(token?: string): Promise<AdminUserDto | AdminMeResponse | null> {
  const res = await apiClient.get<ApiResponse<AdminUserDto | AdminMeResponse>>('/auth/admin/me', { token });
  return res?.data || null;
}
