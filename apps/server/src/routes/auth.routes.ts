import { Router } from 'express';
import { getCustomerMe, getAdminMe } from '../controllers/auth.controller';
import { customerAuthGuard, adminAuthGuard } from '../middlewares/auth.middleware';

export const authRouter: Router = Router();

// Customer Auth routes
authRouter.get('/customer/me', customerAuthGuard, getCustomerMe);

// Admin Auth routes
authRouter.get('/admin/me', adminAuthGuard, getAdminMe);
