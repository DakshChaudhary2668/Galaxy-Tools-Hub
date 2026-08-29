import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  toggleCustomerStatus
} from '../controllers/customer.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const customerRouter: Router = Router();

// All customer routes are admin-protected
customerRouter.get(
  '/',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getCustomers
);

customerRouter.get(
  '/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getCustomerById
);

customerRouter.patch(
  '/:id/status',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  toggleCustomerStatus
);
