import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getAdminTeam
} from '../controllers/settings.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const settingsRouter: Router = Router();

// All settings routes are admin-protected
settingsRouter.get(
  '/',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getSettings
);

settingsRouter.put(
  '/',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  updateSettings
);

settingsRouter.get(
  '/team',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getAdminTeam
);
