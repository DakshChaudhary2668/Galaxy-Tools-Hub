import { NextFunction, Request, Response } from 'express';
import { CouponSchema, CreateCouponSchema } from '@galaxy/types';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/response';

const normalizeCoupon = (payload: Record<string, unknown>) => ({
  ...payload,
  code: typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : payload.code,
  description: payload.description === '' ? null : payload.description,
  minimum_order_amount: payload.minimum_order_amount === '' ? null : payload.minimum_order_amount,
  maximum_discount_amount: payload.maximum_discount_amount === '' ? null : payload.maximum_discount_amount,
  usage_limit: payload.usage_limit === '' ? null : payload.usage_limit,
  starts_at: payload.starts_at === '' ? null : payload.starts_at,
  expires_at: payload.expires_at === '' ? null : payload.expires_at
});

export async function listCoupons(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw new AppError('Failed to retrieve coupons', 500);
    sendSuccess(res, { data: data || [], message: 'Coupons retrieved successfully' });
  } catch (error) { next(error); }
}

export async function createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = normalizeCoupon(req.body);
    const parsed = CreateCouponSchema.safeParse(payload);
    if (!parsed.success) return next(new AppError('Invalid coupon', 400, parsed.error.flatten().fieldErrors as Record<string, string[]>));
    const { data, error } = await supabaseAdmin.from('coupons').insert(parsed.data).select('*').single();
    if (error?.code === '23505') return next(new AppError('Coupon code already exists', 409));
    if (error || !data) throw new AppError('Failed to create coupon', 500);
    sendSuccess(res, { data, message: 'Coupon created successfully', statusCode: 201 });
  } catch (error) { next(error); }
}

export async function updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: current, error: currentError } = await supabaseAdmin.from('coupons').select('*').eq('id', req.params.id).maybeSingle();
    if (currentError) throw new AppError('Failed to retrieve coupon', 500);
    if (!current) return next(new AppError('Coupon not found', 404));

    const candidate = normalizeCoupon({ ...current, ...req.body, id: current.id });
    const parsed = CouponSchema.safeParse(candidate);
    if (!parsed.success) return next(new AppError('Invalid coupon', 400, parsed.error.flatten().fieldErrors as Record<string, string[]>));
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, usage_count: _usageCount, ...changes } = parsed.data;
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error?.code === '23505') return next(new AppError('Coupon code already exists', 409));
    if (error || !data) throw new AppError('Failed to update coupon', 500);
    sendSuccess(res, { data, message: 'Coupon updated successfully' });
  } catch (error) { next(error); }
}

export async function deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { count, error: usageError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', req.params.id);
    if (usageError) throw new AppError('Failed to verify coupon usage', 500);
    if (count) return next(new AppError('Used coupons cannot be deleted; deactivate this coupon instead', 409));
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', req.params.id);
    if (error) throw new AppError('Failed to delete coupon', 500);
    sendSuccess(res, { data: { id: req.params.id }, message: 'Coupon deleted successfully' });
  } catch (error) { next(error); }
}
