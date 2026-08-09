import { apiClient } from './api';

// TODO: implement — GET /api/v1/vendors
export async function getVendors() {
  return apiClient.get('/vendors');
}

// TODO: implement — GET /api/v1/vendors/:id
export async function getVendorById(id: string) {
  return apiClient.get(`/vendors/${id}`);
}
