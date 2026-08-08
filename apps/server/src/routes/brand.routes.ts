import { Router } from 'express';
import {
  getBrands,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brand.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { CreateBrandSchema, UpdateBrandSchema } from '@galaxy/types';
import { Roles } from '@galaxy/constants';

export const brandRouter: Router = Router();

// Public routes
brandRouter.get('/', getBrands);
brandRouter.get('/:slug', getBrandBySlug);

// Admin routes
brandRouter.post(
  '/admin',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateBrandSchema),
  createBrand
);
brandRouter.put(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(UpdateBrandSchema),
  updateBrand
);
brandRouter.delete(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteBrand
);
