import { apiClient } from './api';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '@galaxy/types';

export interface CategoryWithProductCount extends CategoryDto {
  product_count?: number;
}

export async function getCategories(): Promise<CategoryWithProductCount[]> {
  const res = await apiClient.get<{ data: CategoryWithProductCount[] }>('/categories');
  return res?.data || [];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryWithProductCount | null> {
  const res = await apiClient.get<{ data: CategoryWithProductCount }>(`/categories/${slug}`);
  return res?.data || null;
}

export async function createCategory(payload: Partial<CreateCategoryDto>, token?: string): Promise<CategoryDto> {
  const res = await apiClient.post<{ data: CategoryDto }>('/categories/admin', payload, { token });
  return res.data;
}

export async function updateCategory(id: string, payload: Partial<UpdateCategoryDto>, token?: string): Promise<CategoryDto> {
  const res = await apiClient.put<{ data: CategoryDto }>(`/categories/admin/${id}`, payload, { token });
  return res.data;
}

export async function deleteCategory(id: string, token?: string): Promise<{ data: { id: string }; message: string }> {
  return apiClient.delete<{ data: { id: string }; message: string }>(`/categories/admin/${id}`, { token });
}
