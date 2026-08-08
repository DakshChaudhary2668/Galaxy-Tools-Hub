import { supabaseAdmin } from '../config/supabase';

export class StorageRepository {
  async createSignedUploadUrl(bucket: string, path: string): Promise<{ signedUrl: string; path: string }> {
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { signedUrl: data.signedUrl, path: data.path };
  }
}
