import { supabaseAdmin } from '../config/supabase';

export class StorageRepository {
  async createSignedUploadUrl(
    bucket: string,
    path: string
  ): Promise<{ signedUrl: string; path: string; token: string }> {
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message || 'Failed to generate signed upload URL');
    return {
      signedUrl: data.signedUrl,
      path: data.path,
      token: (data as any).token || ''
    };
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteObject(bucket: string, path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Failed to delete storage object ${bucket}/${path}: ${error.message}`);
    }
  }
}
