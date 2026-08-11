import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductImages,
  addProductImage,
  deleteProductImage
} from '../controllers/product.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateProductImageSchema
} from '@galaxy/types';
import { Roles } from '@galaxy/constants';

import {
  getVariantsByProduct,
  createVariant
} from '../controllers/variant.controller';
import { CreateProductVariantSchema } from '@galaxy/types';

export const productRouter: Router = Router();

// Public Catalog routes
productRouter.get('/', getProducts);
productRouter.get('/:slug', getProductBySlug);
productRouter.get('/:id/images', getProductImages);
productRouter.get('/:id/variants', getVariantsByProduct);

// Admin Product CRUD routes
productRouter.post(
  '/admin',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateProductSchema),
  createProduct
);
productRouter.put(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(UpdateProductSchema),
  updateProduct
);
productRouter.delete(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteProduct
);

// Admin Product Image & Variant routes
productRouter.post(
  '/admin/:id/variants',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateProductVariantSchema),
  createVariant
);

productRouter.post(
  '/admin/:id/images',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateProductImageSchema),
  addProductImage
);
productRouter.delete(
  '/admin/:id/images/:imageId',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteProductImage
);
