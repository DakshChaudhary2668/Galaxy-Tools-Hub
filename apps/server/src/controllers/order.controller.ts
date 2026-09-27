import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { isOrderStatus, OrderStatus, OrderStatusType } from '@galaxy/constants';

const orderService = new OrderService();

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await orderService.listOrdersWithFilters(req.query);
    sendSuccess(res, {
      data: result.orders,
      message: 'Orders retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await orderService.getOrderDetailsFull(req.params.id);
    if (!details) {
      return next(new AppError('Order not found', 404));
    }
    sendSuccess(res, { data: details, message: 'Order details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    if (!isOrderStatus(status)) {
      return next(new AppError('A valid target order status is required', 400));
    }

    const orderId = req.params.id;
    let updated;

    if (status === OrderStatus.CANCELLED) {
      updated = await orderService.cancelOrder(orderId);
    } else if (status === OrderStatus.REFUNDED) {
      updated = await orderService.refundOrder(orderId);
    } else {
      updated = await orderService.transitionStatus(orderId, status as OrderStatusType);
    }

    sendSuccess(res, { data: updated, message: `Order status updated to ${status}` });
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
