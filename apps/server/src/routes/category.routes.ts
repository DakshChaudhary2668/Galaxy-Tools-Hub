import { Router } from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { CreateCategorySchema, UpdateCategorySchema } from '@galaxy/types';
import { Roles } from '@galaxy/constants';

export const categoryRouter: Router = Router();

// Public routes
categoryRouter.get('/', getCategories);
categoryRouter.get('/:slug', getCategoryBySlug);

// Admin routes
categoryRouter.post(
  '/admin',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateCategorySchema),
  createCategory
);
categoryRouter.put(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(UpdateCategorySchema),
  updateCategory
);
categoryRouter.delete(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteCategory
);
