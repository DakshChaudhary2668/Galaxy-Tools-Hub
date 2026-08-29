import { apiClient } from './api';
import { ProfileDto, UserAddressDto, OrderDto } from '@galaxy/types';

export interface AdminCustomerListItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
}

export interface AdminCustomersResponse {
  data: AdminCustomerListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AdminCustomerDetail {
  profile: ProfileDto;
  stats: {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    last_order_at: string | null;
  };
  orders: OrderDto[];
  addresses: UserAddressDto[];
}

export async function getAdminCustomers(params?: Record<string, unknown>, token?: string) {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryObj[key] = String(val);
      }
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  return apiClient.get<AdminCustomersResponse>(`/customers${qs}`, { token });
}

export async function getAdminCustomerById(id: string, token?: string) {
  return apiClient.get<{ data: AdminCustomerDetail }>(`/customers/${id}`, { token });
}

export async function toggleCustomerStatus(id: string, is_active: boolean, token?: string) {
  return apiClient.patch<{ data: ProfileDto }>(`/customers/${id}/status`, { is_active }, { token });
}
