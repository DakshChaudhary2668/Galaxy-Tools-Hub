import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createDraftOrder,
  markPendingPayment,
  markPaid,
  cancelOrder,
  refundOrder,
  completeOrder
} from '../controllers/order.controller';
import { adminAuthGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const orderRouter: Router = Router();

// Draft creation & public/customer routes (if unauthenticated)
orderRouter.post('/draft', createDraftOrder);

// Admin / protected order management routes
orderRouter.get('/', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]), getOrders);
orderRouter.get('/:id', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]), getOrderById);
orderRouter.post('/:id/pending-payment', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER]), markPendingPayment);
orderRouter.post('/:id/paid', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER]), markPaid);
orderRouter.post('/:id/cancel', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER]), cancelOrder);
orderRouter.post('/:id/refund', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER]), refundOrder);
orderRouter.post('/:id/complete', adminAuthGuard, rbacGuard([Roles.OWNER, Roles.MANAGER]), completeOrder);
