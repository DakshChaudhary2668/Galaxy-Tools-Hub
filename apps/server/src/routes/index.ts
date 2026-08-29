import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { categoryRouter } from './category.routes';
import { brandRouter } from './brand.routes';
import { vendorRouter } from './vendor.routes';
import { productRouter } from './product.routes';
import { variantRouter } from './variant.routes';
import { orderRouter } from './order.routes';
import { storageRouter } from './storage.routes';
import { paymentRouter } from './payment.routes';
import { analyticsRouter } from './analytics.routes';
import { customerRouter } from './customer.routes';
import { couponRouter } from './coupon.routes';
import { settingsRouter } from './settings.routes';
import { inventoryRouter } from './inventory.routes';

export const apiRouter: Router = Router();

apiRouter.get('/health', getHealth);
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/brands', brandRouter);
apiRouter.use('/vendors', vendorRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/variants', variantRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/storage', storageRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/coupons', couponRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/inventory', inventoryRouter);


