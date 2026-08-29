import { apiClient } from './api';
import {
  ProductDto,
  ProductDetailDto,
  ProductImageDto,
  ProductVariantDto,
  CreateProductDto,
  UpdateProductDto
} from '@galaxy/types';

export interface AdminProductsResponse {
  data: ProductDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function getProducts(params?: Record<string, unknown>, token?: string) {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryObj[key] = String(val);
      }
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  return apiClient.get<AdminProductsResponse>(`/products${qs}`, { token });
}

export async function getProductBySlug(slug: string) {
  return apiClient.get<{ data: ProductDetailDto }>(`/products/${slug}`);
}

export async function getProductById(id: string) {
  return apiClient.get<{ data: ProductDetailDto }>(`/products/${id}`);
}

export async function createProduct(payload: Partial<CreateProductDto> & { stock?: number; lowStockThreshold?: number; image_url?: string }, token?: string) {
  return apiClient.post<{ data: ProductDto }>('/products/admin', payload, { token });
}

export async function updateProduct(id: string, payload: Partial<UpdateProductDto> & { stock?: number; lowStockThreshold?: number; image_url?: string }, token?: string) {
  return apiClient.put<{ data: ProductDto }>(`/products/admin/${id}`, payload, { token });
}

export async function deleteProduct(id: string, token?: string) {
  return apiClient.delete<{ data: { id: string; action: string }; message: string }>(`/products/admin/${id}`, { token });
}

export async function getProductImages(id: string) {
  return apiClient.get<ProductImageDto[]>(`/products/${id}/images`);
}

export async function getProductVariants(id: string) {
  return apiClient.get<ProductVariantDto[]>(`/products/${id}/variants`);
}
