import { Request, Response, NextFunction } from 'express';
import { BaseRepository } from '../repositories/base.repository';
import { OrderDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const orderRepository = new BaseRepository<OrderDto>('orders');

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const orders = await orderRepository.list(limit);
    sendSuccess(res, { data: orders, message: 'Orders retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }
    sendSuccess(res, { data: order, message: 'Order details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}
