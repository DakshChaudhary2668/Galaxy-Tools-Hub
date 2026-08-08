import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storage.service';
import { sendSuccess } from '../utils/response';

const storageService = new StorageService();

export async function getSignedUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bucket, path } = req.body;
    const result = await storageService.getSignedUploadUrl(bucket, path);
    sendSuccess(res, result, 'Signed upload URL generated successfully');
  } catch (error) {
    next(error);
  }
}
