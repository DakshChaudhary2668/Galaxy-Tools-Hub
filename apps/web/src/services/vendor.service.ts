import { VendorDto } from '@galaxy/types';
import { apiClient } from './api';

export async function getVendors(): Promise<VendorDto[]> {
  const response = await apiClient.get<{ data: VendorDto[] }>('/vendors');
  return response.data || [];
}
