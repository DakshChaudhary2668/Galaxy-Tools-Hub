import { Router } from 'express';
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from '../controllers/coupon.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { CreateCouponSchema, UpdateCouponSchema } from '@galaxy/types';
import { Roles } from '@galaxy/constants';

export const couponRouter: Router = Router();
const adminRoles = rbacGuard([Roles.OWNER, Roles.MANAGER]);

couponRouter.get('/admin', adminAuthGuard, adminRoles, listCoupons);
couponRouter.post('/admin', adminAuthGuard, adminRoles, validateRequest(CreateCouponSchema), createCoupon);
couponRouter.put('/admin/:id', adminAuthGuard, adminRoles, validateRequest(UpdateCouponSchema), updateCoupon);
couponRouter.delete('/admin/:id', adminAuthGuard, adminRoles, deleteCoupon);
