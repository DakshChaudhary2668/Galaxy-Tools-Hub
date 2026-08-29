import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { CouponDto, DiscountType } from '@galaxy/types';
import { randomUUID } from 'crypto';

export type CouponStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export interface EnrichedCoupon extends CouponDto {
  status: CouponStatus;
}

export function computeCouponStatus(coupon: Partial<CouponDto>): CouponStatus {
  if (!coupon.is_active) return 'DISABLED';
  const now = new Date();
  if (coupon.end_date && new Date(coupon.end_date) < now) return 'EXPIRED';
  if (coupon.start_date && new Date(coupon.start_date) > now) return 'SCHEDULED';
  return 'ACTIVE';
}

export async function getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let query = supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });

    if (req.query.search && typeof req.query.search === 'string') {
      const s = req.query.search.trim().toUpperCase();
      query = query.ilike('code', `%${s}%`);
    }

    const { data: rawCoupons, error } = await query;
    if (error) {
      // If table does not exist or empty in dev, handle gracefully
      if (error.code === '42P01') {
        sendSuccess(res, { data: [], message: 'Coupons retrieved successfully' });
        return;
      }
      throw new Error(error.message);
    }

    let coupons: EnrichedCoupon[] = (rawCoupons || []).map((c: any) => ({
      ...c,
      status: computeCouponStatus(c)
    }));

    // Filter by status if requested
    if (req.query.status && req.query.status !== 'all') {
      coupons = coupons.filter((c) => c.status === (req.query.status as string).toUpperCase());
    }

    sendSuccess(res, { data: coupons, message: 'Coupons retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getCouponById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    sendSuccess(res, {
      data: { ...coupon, status: computeCouponStatus(coupon) },
      message: 'Coupon retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    if (!payload.code) {
      return next(new AppError('Coupon code is required', 400));
    }

    const code = payload.code.trim().toUpperCase();

    // Check unique code
    const { data: existing } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('code', code)
      .limit(1);

    if (existing && existing.length > 0) {
      return next(new AppError(`Coupon code "${code}" already exists.`, 400));
    }

    const discountValue = Number(payload.discount_value);
    if (!discountValue || discountValue <= 0) {
      return next(new AppError('Discount value must be a positive number.', 400));
    }

    if (payload.discount_type === DiscountType.PERCENTAGE && discountValue > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%.', 400));
    }

    if (payload.start_date && payload.end_date) {
      if (new Date(payload.end_date) <= new Date(payload.start_date)) {
        return next(new AppError('Expiry date must be after start date.', 400));
      }
    }

    const newCoupon = {
      id: randomUUID(),
      code,
      discount_type: payload.discount_type || DiscountType.PERCENTAGE,
      discount_value: discountValue,
      min_order_value: Number(payload.min_order_value) || 0,
      max_discount_amount: payload.max_discount_amount ? Number(payload.max_discount_amount) : null,
      usage_limit: payload.usage_limit ? Number(payload.usage_limit) : null,
      usage_count: 0,
      per_customer_limit: Number(payload.per_customer_limit) || 1,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('coupons').insert(newCoupon).select().single();
    if (error) throw new Error(error.message);

    sendSuccess(res, {
      data: { ...data, status: computeCouponStatus(data) },
      message: 'Coupon created successfully',
      statusCode: 201
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const couponId = req.params.id;
    const payload = req.body;

    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
      const { data: existing } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('code', payload.code)
        .neq('id', couponId)
        .limit(1);

      if (existing && existing.length > 0) {
        return next(new AppError(`Coupon code "${payload.code}" already exists.`, 400));
      }
    }

    if (payload.discount_type === DiscountType.PERCENTAGE && payload.discount_value > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%.', 400));
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    sendSuccess(res, {
      data: { ...data, status: computeCouponStatus(data) },
      message: 'Coupon updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const couponId = req.params.id;

    // Check if referenced by historical orders
    const { data: ordersWithCoupon } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('coupon_id', couponId)
      .limit(1);

    if (ordersWithCoupon && ordersWithCoupon.length > 0) {
      // Deactivate instead of hard delete to preserve historical order references
      await supabaseAdmin.from('coupons').update({ is_active: false }).eq('id', couponId);
      sendSuccess(res, {
        data: { id: couponId, action: 'deactivated' },
        message: 'Coupon is linked to past orders and was safely disabled/archived.'
      });
      return;
    }

    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', couponId);
    if (error) throw new Error(error.message);

    sendSuccess(res, {
      data: { id: couponId, action: 'deleted' },
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/coupons/validate — Server-side discount calculation
export async function validateCouponForCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }
    const orderSubtotal = Number(subtotal) || 0;
    if (orderSubtotal <= 0) {
      return next(new AppError('Subtotal must be greater than zero to apply a coupon', 400));
    }

    const normalizedCode = code.trim().toUpperCase();
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error || !coupon) {
      return next(new AppError(`Invalid coupon code "${normalizedCode}".`, 404));
    }

    const status = computeCouponStatus(coupon);
    if (status === 'DISABLED') {
      return next(new AppError(`Coupon "${normalizedCode}" is currently inactive.`, 400));
    }
    if (status === 'EXPIRED') {
      return next(new AppError(`Coupon "${normalizedCode}" has expired.`, 400));
    }
    if (status === 'SCHEDULED') {
      return next(new AppError(`Coupon "${normalizedCode}" is not yet active.`, 400));
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return next(new AppError(`Coupon "${normalizedCode}" has reached its maximum total usage limit.`, 400));
    }

    // Check minimum order value
    if (coupon.min_order_value && orderSubtotal < coupon.min_order_value) {
      return next(
        new AppError(
          `Coupon "${normalizedCode}" requires a minimum order value of ₹${coupon.min_order_value}.`,
          400
        )
      );
    }

    // Calculate server-side discount amount
    let discountAmount = 0;
    if (coupon.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = Math.round(orderSubtotal * (coupon.discount_value / 100));
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = Math.min(coupon.discount_value, orderSubtotal);
    }

    const finalSubtotal = Math.max(orderSubtotal - discountAmount, 0);

    sendSuccess(res, {
      data: {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value
        },
        discountAmount,
        finalSubtotal
      },
      message: `Coupon "${normalizedCode}" applied! ₹${discountAmount} discount.`
    });
  } catch (error) {
    next(error);
  }
}
