import { apiClient } from './api';
import { CategoryDto } from '@galaxy/types';

export async function getCategories() {
  return apiClient.get<CategoryDto[]>('/categories');
}

export async function getCategoryBySlug(slug: string) {
  return apiClient.get<CategoryDto>(`/categories/${slug}`);
}
