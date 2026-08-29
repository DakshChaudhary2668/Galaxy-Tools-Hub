import { Router } from 'express';
import { createCheckout, verifyPayment, getPublicOrderStatus } from '../controllers/payment.controller';

export const paymentRouter: Router = Router();

// Public checkout & verification endpoints
paymentRouter.post('/checkout', createCheckout);
paymentRouter.post('/verify', verifyPayment);
paymentRouter.get('/order-status/:id', getPublicOrderStatus);

