import { Request, Response, NextFunction } from 'express';
import { StorageRepository } from '../repositories/storage.repository';
import { sendSuccess } from '../utils/response';

const storageRepository = new StorageRepository();

export async function getSignedUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bucket, path } = req.body;
    const result = await storageRepository.createSignedUploadUrl(bucket, path);
    sendSuccess(res, { data: result, message: 'Signed upload URL generated successfully' });
  } catch (error) {
    next(error);
  }
}
