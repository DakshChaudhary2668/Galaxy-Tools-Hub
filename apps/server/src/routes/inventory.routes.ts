import { Router } from 'express';
import {
  getInventoryList,
  adjustInventoryStock
} from '../controllers/inventory.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const inventoryRouter: Router = Router();

// Protected inventory routes
inventoryRouter.get(
  '/',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getInventoryList
);

inventoryRouter.put(
  '/:id/adjust',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  adjustInventoryStock
);
