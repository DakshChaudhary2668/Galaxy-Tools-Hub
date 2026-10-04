import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductImages,
  deleteProductImage,
  completeProductImage,
  removeProductPrimaryImage,
  setPrimaryProductImage
} from '../controllers/product.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductImageCompleteRequestSchema
} from '@galaxy/types';
import { Roles } from '@galaxy/constants';


export const productRouter: Router = Router();

// Public Catalog routes
productRouter.get('/', getProducts);
productRouter.get('/:slug', getProductBySlug);
productRouter.get('/:id/images', getProductImages);

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

// Sprint 3: Complete upload of a managed product image
productRouter.post(
  '/admin/:id/images/complete',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(ProductImageCompleteRequestSchema),
  completeProductImage
);

// Sprint 3: Remove primary product image (cleans up managed storage object if applicable)
productRouter.delete(
  '/admin/:id/images/primary',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  removeProductPrimaryImage
);

productRouter.delete(
  '/admin/:id/image',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  removeProductPrimaryImage
);

productRouter.delete(
  '/admin/:id/images/:imageId',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteProductImage
);
productRouter.put(
  '/admin/:id/images/:imageId/primary',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  setPrimaryProductImage
);
