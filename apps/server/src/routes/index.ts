import { Router } from 'express';
import { productRouter } from './product.routes';
import { orderRouter } from './order.routes';
import { storageRouter } from './storage.routes';

export const apiRouter: Router = Router();

apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/storage', storageRouter);
