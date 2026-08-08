import { StorageRepository } from '../repositories/storage.repository';

export class StorageService {
  private storageRepository: StorageRepository;

  constructor() {
    this.storageRepository = new StorageRepository();
  }

  async getSignedUploadUrl(bucket: string, path: string): Promise<{ signedUrl: string; path: string }> {
    return this.storageRepository.createSignedUploadUrl(bucket, path);
  }
}
