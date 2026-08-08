import { Router } from 'express';
import { getOrders, getOrderById } from '../controllers/order.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { rbacGuard } from '../middlewares/rbac.middleware';
import { Roles } from '@galaxy/constants';

export const orderRouter: Router = Router();

orderRouter.use(authGuard);
orderRouter.get('/', rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]), getOrders);
orderRouter.get('/:id', rbacGuard([Roles.OWNER, Roles.MANAGER, Roles.STAFF]), getOrderById);
