import { apiClient } from './api';

// TODO: implement — POST /api/v1/storage/signed-url
export async function getSignedUploadUrl(
  _payload: { bucket: string; filename: string; contentType: string },
  _token?: string
) {
  return apiClient.post('/storage/signed-url', _payload, { token: _token });
}
