import { apiClient } from './api';

export interface StoreGeneralSettings {
  storeName: string;
  businessName: string;
  businessEmail: string;
  supportPhone: string;
  address: string;
  gstin: string;
  supportHours: string;
}

export interface StoreCommerceSettings {
  currency: string;
  defaultGSTRate: number;
  freeShippingThreshold: number;
  flatShippingFee: number;
  lowStockThreshold: number;
  minimumOrderQuantity: number;
}

export interface StoreNotificationSettings {
  orderConfirmationEmail: boolean;
  adminLowStockAlerts: boolean;
  dailySummaryDigest: boolean;
  smsNotifications: boolean;
}

export interface StorePaymentStatus {
  gateway: string;
  isConfigured: boolean;
  mode: 'TEST_MODE' | 'LIVE_MODE';
  keyIdMasked: string;
  bankTransferEnabled: boolean;
  neftAccountName: string;
  neftAccountNumber: string;
  neftIfscCode: string;
}

export interface StoreSystemInfo {
  environment: string;
  apiVersion: string;
  database: string;
  authSystem: string;
  storageSystem: string;
}

export interface StoreSettingsData {
  general: StoreGeneralSettings;
  commerce: StoreCommerceSettings;
  notifications: StoreNotificationSettings;
  payment: StorePaymentStatus;
  system: StoreSystemInfo;
}

export interface AdminTeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export async function getStoreSettings(token?: string): Promise<StoreSettingsData | null> {
  const res = await apiClient.get<{ data: StoreSettingsData }>('/settings', { token });
  return res?.data || null;
}

export async function updateStoreSettings(payload: Partial<StoreSettingsData>, token?: string): Promise<Partial<StoreSettingsData>> {
  const res = await apiClient.put<{ data: Partial<StoreSettingsData> }>('/settings', payload, { token });
  return res.data;
}

export async function getAdminTeamUsers(token?: string): Promise<AdminTeamUser[]> {
  const res = await apiClient.get<{ data: AdminTeamUser[] }>('/settings/team', { token });
  return res?.data || [];
}
