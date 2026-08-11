import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const orderService = new OrderService();

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const orders = await orderService.listOrders(limit);
    sendSuccess(res, { data: orders, message: 'Orders retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }
    sendSuccess(res, { data: order, message: 'Order details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createDraftOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.createDraftOrder(req.body);
    sendSuccess(res, { data: order, message: 'Draft order created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

export async function markPendingPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.markPendingPayment(req.params.id);
    sendSuccess(res, { data: order, message: 'Order marked as pending payment' });
  } catch (error) {
    next(error);
  }
}

export async function markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.markPaid(req.params.id);
    sendSuccess(res, { data: order, message: 'Order marked as paid and stock decremented' });
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.cancelOrder(req.params.id);
    sendSuccess(res, { data: order, message: 'Order cancelled and inventory released' });
  } catch (error) {
    next(error);
  }
}

export async function refundOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.refundOrder(req.params.id);
    sendSuccess(res, { data: order, message: 'Order refunded and inventory released' });
  } catch (error) {
    next(error);
  }
}

export async function completeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.completeOrder(req.params.id);
    sendSuccess(res, { data: order, message: 'Order completed' });
  } catch (error) {
    next(error);
  }
}
