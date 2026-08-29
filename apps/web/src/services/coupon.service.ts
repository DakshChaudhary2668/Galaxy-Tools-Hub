import { apiClient } from './api';
import { CouponDto, CreateCouponDto, UpdateCouponDto } from '@galaxy/types';

export type CouponStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export interface AdminCouponListItem extends CouponDto {
  status: CouponStatus;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  };
  discountAmount: number;
  finalSubtotal: number;
}

export async function getAdminCoupons(params?: Record<string, unknown>, token?: string) {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryObj[key] = String(val);
      }
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  return apiClient.get<AdminCouponListItem[]>(`/coupons${qs}`, { token });
}

export async function getAdminCouponById(id: string, token?: string) {
  return apiClient.get<{ data: AdminCouponListItem }>(`/coupons/${id}`, { token });
}

export async function createAdminCoupon(payload: Partial<CreateCouponDto>, token?: string) {
  return apiClient.post<{ data: AdminCouponListItem }>('/coupons/admin', payload, { token });
}

export async function updateAdminCoupon(id: string, payload: Partial<UpdateCouponDto>, token?: string) {
  return apiClient.put<{ data: AdminCouponListItem }>(`/coupons/admin/${id}`, payload, { token });
}

export async function deleteAdminCoupon(id: string, token?: string) {
  return apiClient.delete<{ data: { id: string; action: string }; message: string }>(`/coupons/admin/${id}`, { token });
}

export async function validateCoupon(code: string, subtotal: number) {
  return apiClient.post<CouponValidationResult>('/coupons/validate', { code, subtotal });
}
