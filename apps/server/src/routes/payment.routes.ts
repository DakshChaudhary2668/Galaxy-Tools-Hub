import { Router } from 'express';
import { createCheckout, verifyPayment, getPublicOrderStatus, handleRazorpayWebhook } from '../controllers/payment.controller';

export const paymentRouter: Router = Router();

// Public checkout & verification endpoints
paymentRouter.post('/checkout', createCheckout);
paymentRouter.post('/verify', verifyPayment);
paymentRouter.post('/webhook/razorpay', handleRazorpayWebhook);
paymentRouter.get('/order-status/:id', getPublicOrderStatus);
