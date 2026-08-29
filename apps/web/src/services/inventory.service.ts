import { apiClient } from './api';

export interface AdminInventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  brand: string;
  quantity: number;
  reservedQuantity: number;
  availableStock: number;
  reorderLevel: number;
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';
  updatedAt: string;
}

export async function getAdminInventory(params?: { search?: string; filter?: string }, token?: string) {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) queryObj[k] = v;
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  return apiClient.get<{ data: AdminInventoryItem[] }>(`/inventory${qs}`, { token });
}

export async function adjustAdminInventory(
  id: string,
  payload: { quantity?: number; reorderLevel?: number },
  token?: string
) {
  return apiClient.put<{ data: any }>(`/inventory/${id}/adjust`, payload, { token });
}
