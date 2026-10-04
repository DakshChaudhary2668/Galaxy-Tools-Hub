import { CouponDto, CreateCouponDto, UpdateCouponDto } from '@galaxy/types';
import { apiClient } from './api';

export async function getAdminCoupons(): Promise<CouponDto[]> {
  const response = await apiClient.get<{ data: CouponDto[] }>('/coupons/admin');
  return response.data || [];
}

export async function createAdminCoupon(payload: CreateCouponDto): Promise<CouponDto> {
  const response = await apiClient.post<{ data: CouponDto }>('/coupons/admin', payload);
  return response.data;
}

export async function updateAdminCoupon(id: string, payload: UpdateCouponDto): Promise<CouponDto> {
  const response = await apiClient.put<{ data: CouponDto }>(`/coupons/admin/${id}`, payload);
  return response.data;
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  await apiClient.delete(`/coupons/admin/${id}`);
}
