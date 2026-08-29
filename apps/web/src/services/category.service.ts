import { apiClient } from './api';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '@galaxy/types';

export interface CategoryWithProductCount extends CategoryDto {
  product_count?: number;
}

export async function getCategories() {
  return apiClient.get<CategoryWithProductCount[]>('/categories');
}

export async function getCategoryBySlug(slug: string) {
  return apiClient.get<CategoryWithProductCount>(`/categories/${slug}`);
}

export async function createCategory(payload: Partial<CreateCategoryDto>, token?: string) {
  return apiClient.post<{ data: CategoryDto }>('/categories/admin', payload, { token });
}

export async function updateCategory(id: string, payload: Partial<UpdateCategoryDto>, token?: string) {
  return apiClient.put<{ data: CategoryDto }>(`/categories/admin/${id}`, payload, { token });
}

export async function deleteCategory(id: string, token?: string) {
  return apiClient.delete<{ data: { id: string }; message: string }>(`/categories/admin/${id}`, { token });
}
