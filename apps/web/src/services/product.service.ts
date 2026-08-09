import { apiClient } from './api';

// TODO: implement — GET /api/v1/products
export async function getProducts(params?: Record<string, unknown>) {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiClient.get(`/products${qs}`);
}

// TODO: implement — GET /api/v1/products/:slug
export async function getProductBySlug(slug: string) {
  return apiClient.get(`/products/${slug}`);
}

// TODO: implement — GET /api/v1/products/:id/images
export async function getProductImages(id: string) {
  return apiClient.get(`/products/${id}/images`);
}

// TODO: implement — GET /api/v1/products/:id/variants
export async function getProductVariants(id: string) {
  return apiClient.get(`/products/${id}/variants`);
}
