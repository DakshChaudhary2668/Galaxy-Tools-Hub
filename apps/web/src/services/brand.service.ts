import { apiClient } from './api';
import { BrandDto } from '@galaxy/types';

export async function getBrands() {
  return apiClient.get<BrandDto[]>('/brands');
}

export async function getBrandBySlug(slug: string) {
  return apiClient.get<BrandDto>(`/brands/${slug}`);
}
