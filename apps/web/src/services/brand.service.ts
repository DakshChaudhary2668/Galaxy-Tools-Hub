import { apiClient } from './api';

// TODO: implement — GET /api/v1/brands
export async function getBrands() {
  return apiClient.get('/brands');
}

// TODO: implement — GET /api/v1/brands/:slug
export async function getBrandBySlug(slug: string) {
  return apiClient.get(`/brands/${slug}`);
}
