import { Router } from 'express';
import {
  getVariantById,
  getVariantBySku,
  createVariant,
  updateVariant,
  deleteVariant
} from '../controllers/variant.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { CreateProductVariantSchema, UpdateProductVariantSchema } from '@galaxy/types';
import { Roles } from '@galaxy/constants';

export const variantRouter: Router = Router();

// Public Variant routes
variantRouter.get('/sku/:sku', getVariantBySku);
variantRouter.get('/:id', getVariantById);

// Admin Variant routes
variantRouter.post(
  '/admin',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateProductVariantSchema),
  createVariant
);

variantRouter.put(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(UpdateProductVariantSchema),
  updateVariant
);

variantRouter.delete(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteVariant
);
