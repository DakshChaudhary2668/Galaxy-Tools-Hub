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

export async function getAdminInventory(params?: { search?: string; filter?: string }, token?: string): Promise<AdminInventoryItem[]> {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) queryObj[k] = v;
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  const res = await apiClient.get<{ data: AdminInventoryItem[] }>(`/inventory${qs}`, { token });
  return res?.data || [];
}

export async function adjustAdminInventory(
  id: string,
  payload: { quantity?: number; reorderLevel?: number },
  token?: string
): Promise<AdminInventoryItem> {
  const res = await apiClient.put<{ data: AdminInventoryItem }>(`/inventory/${id}/adjust`, payload, { token });
  return res.data;
}
