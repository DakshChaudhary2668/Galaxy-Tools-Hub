import { apiClient } from './api';

export interface EnquiryPayload {
  type: 'contact' | 'dealer';
  name: string;
  email: string;
  phone?: string;
  company: string;
  subject: string;
  message: string;
  website?: string;
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<void> {
  await apiClient.post('/enquiries', payload);
}
