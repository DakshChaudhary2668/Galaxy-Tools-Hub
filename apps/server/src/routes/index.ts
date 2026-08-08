import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { authRouter } from './auth.routes';
import { categoryRouter } from './category.routes';
import { brandRouter } from './brand.routes';
import { vendorRouter } from './vendor.routes';
import { productRouter } from './product.routes';
import { orderRouter } from './order.routes';
import { storageRouter } from './storage.routes';

export const apiRouter: Router = Router();

apiRouter.get('/health', getHealth);
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/brands', brandRouter);
apiRouter.use('/vendors', vendorRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/storage', storageRouter);
