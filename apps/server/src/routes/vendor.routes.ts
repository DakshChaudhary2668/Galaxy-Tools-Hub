import { Router } from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} from '../controllers/vendor.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { CreateVendorSchema, UpdateVendorSchema } from '@galaxy/types';
import { Roles } from '@galaxy/constants';

export const vendorRouter: Router = Router();

// Public routes
vendorRouter.get('/', getVendors);
vendorRouter.get('/:id', getVendorById);

// Admin routes
vendorRouter.post(
  '/admin',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(CreateVendorSchema),
  createVendor
);
vendorRouter.put(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  validateRequest(UpdateVendorSchema),
  updateVendor
);
vendorRouter.delete(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteVendor
);
