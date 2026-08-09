import { apiClient } from './api';

// TODO: implement — GET /api/v1/categories
export async function getCategories() {
  return apiClient.get('/categories');
}

// TODO: implement — GET /api/v1/categories/:slug
export async function getCategoryBySlug(slug: string) {
  return apiClient.get(`/categories/${slug}`);
}
