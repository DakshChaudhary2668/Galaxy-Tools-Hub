import { apiClient } from './api';
import { ProductVariantDto, CreateProductVariantDto, UpdateProductVariantDto } from '@galaxy/types';

export async function getVariantsByProduct(productId: string) {
  return apiClient.get<ProductVariantDto[]>(`/products/${productId}/variants`);
}

export async function getVariantById(id: string) {
  return apiClient.get<ProductVariantDto>(`/variants/${id}`);
}

export async function getVariantBySku(sku: string) {
  return apiClient.get<ProductVariantDto>(`/variants/sku/${sku}`);
}

export async function createVariant(productId: string, payload: CreateProductVariantDto, token?: string) {
  return apiClient.post<ProductVariantDto>(`/products/admin/${productId}/variants`, payload, { token });
}

export async function updateVariant(id: string, payload: UpdateProductVariantDto, token?: string) {
  return apiClient.put<ProductVariantDto>(`/variants/admin/${id}`, payload, { token });
}

export async function deleteVariant(id: string, token?: string) {
  return apiClient.delete<{ id: string }>(`/variants/admin/${id}`, { token });
}
