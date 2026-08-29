import { Router } from 'express';
import {
  getDashboardSummary,
  getDetailedAnalytics
} from '../controllers/analytics.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const analyticsRouter: Router = Router();

// Analytics summary endpoints
analyticsRouter.get('/dashboard-summary', getDashboardSummary);
analyticsRouter.get(
  '/detailed',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getDetailedAnalytics
);
