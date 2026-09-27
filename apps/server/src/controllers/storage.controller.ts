import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { StorageRepository } from '../repositories/storage.repository';
import { ProductRepository } from '../repositories/product.repository';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { StorageBuckets } from '@galaxy/constants';
import { ProductImageSignedUploadRequestDto } from '@galaxy/types';

const storageRepository = new StorageRepository();
const productRepository = new ProductRepository();

export async function getSignedUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bucket, path } = req.body;
    const result = await storageRepository.createSignedUploadUrl(bucket, path);
    sendSuccess(res, { data: result, message: 'Signed upload URL generated successfully' });
  } catch (error) {
    next(error);
  }
}
export async function getProductImageUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { product_id, extension } = req.body as ProductImageSignedUploadRequestDto;

    // 1. Verify product exists before authorizing upload
    const product = await productRepository.findById(product_id);
    if (!product) {
      return next(new AppError('Product not found. Cannot generate image upload URL for non-existent product.', 404));
    }

    // 2. Generate secure UUID filename and server-constructed object path
    const fileUuid = crypto.randomUUID();
    const cleanExt = extension.toLowerCase().replace(/^\./, '');
    const objectPath = `products/${product_id}/${fileUuid}.${cleanExt}`;

    // 3. Request signed upload URL from Supabase Storage (product-images bucket)
    const signedData = await storageRepository.createSignedUploadUrl(StorageBuckets.PRODUCT_IMAGES, objectPath);

    // 4. Derive public CDN URL server-side
    const publicUrl = storageRepository.getPublicUrl(StorageBuckets.PRODUCT_IMAGES, objectPath);

    sendSuccess(res, {
      data: {
        signedUrl: signedData.signedUrl,
        path: objectPath,
        token: signedData.token,
        publicUrl
      },
      message: 'Product image signed upload URL generated successfully'
    });
  } catch (error) {
    next(error);
  }
}
