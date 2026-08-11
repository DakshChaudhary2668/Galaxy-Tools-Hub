import { apiClient } from './api';
import { ProductDto, ProductDetailDto, ProductImageDto, ProductVariantDto } from '@galaxy/types';

export async function getProducts(params?: Record<string, unknown>) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiClient.get<ProductDto[]>(`/products${qs}`);
}

export async function getProductBySlug(slug: string) {
  return apiClient.get<ProductDetailDto>(`/products/${slug}`);
}

export async function getProductImages(id: string) {
  return apiClient.get<ProductImageDto[]>(`/products/${id}/images`);
}

export async function getProductVariants(id: string) {
  return apiClient.get<ProductVariantDto[]>(`/products/${id}/variants`);
}
