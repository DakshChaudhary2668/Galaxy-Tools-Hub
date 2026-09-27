import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

export async function getCustomerMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.customer) {
      return next(new AppError('Unauthorized: Customer session missing', 401));
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', req.customer.userId)
      .maybeSingle();

    sendSuccess(res, {
      data: profile || req.customer,
      message: 'Customer profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized: Admin session missing', 401));
    }
    sendSuccess(res, {
      data: req.user,
      message: 'Admin details retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}
