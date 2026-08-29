import { Router } from 'express';
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCouponForCheckout
} from '../controllers/coupon.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const couponRouter: Router = Router();

// Public / Checkout endpoint for calculating verified discount
couponRouter.post('/validate', validateCouponForCheckout);

// Admin-protected Coupon Management routes
couponRouter.get(
  '/',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getCoupons
);

couponRouter.get(
  '/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  getCouponById
);

couponRouter.post(
  '/admin',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  createCoupon
);

couponRouter.put(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  updateCoupon
);

couponRouter.delete(
  '/admin/:id',
  adminAuthGuard,
  rbacGuard([Roles.OWNER, Roles.MANAGER]),
  deleteCoupon
);
