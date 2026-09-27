import { apiClient } from './api';
import { BrandDto } from '@galaxy/types';

export async function getBrands(): Promise<BrandDto[]> {
  const res = await apiClient.get<{ data: BrandDto[] }>('/brands');
  return res?.data || [];
}

export async function getBrandBySlug(slug: string): Promise<BrandDto | null> {
  const res = await apiClient.get<{ data: BrandDto }>(`/brands/${slug}`);
  return res?.data || null;
}
