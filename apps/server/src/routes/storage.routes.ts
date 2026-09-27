import { Router } from 'express';
import { getSignedUploadUrl, getProductImageUploadUrl } from '../controllers/storage.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { SignedUrlRequestSchema, ProductImageSignedUploadRequestSchema } from '@galaxy/types';
import { Roles } from '@galaxy/constants';

export const storageRouter: Router = Router();

storageRouter.post(
  '/signed-url',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  validateRequest(SignedUrlRequestSchema),
  getSignedUploadUrl
);
storageRouter.post(
  '/product-image-upload-url',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(ProductImageSignedUploadRequestSchema),
  getProductImageUploadUrl
);
