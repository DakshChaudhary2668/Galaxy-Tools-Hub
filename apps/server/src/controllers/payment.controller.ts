import { Request, Response, NextFunction } from 'express';
import { getRazorpay } from '../config/razorpay';
import { env } from '../config/env';
import { OrderService } from '../services/order.service';
import {
  assertRazorpayPaymentFacts,
  buildAuthoritativeCheckout,
  buildPendingRazorpayPayment,
  CheckoutInventory,
  CheckoutProduct,
  PaymentMapping,
  requirePaymentMapping,
  verifyRazorpayWebhookSignature,
  verifyRazorpaySignature
} from '../services/payment.service';
import { finalizeRazorpayPayment, releaseOrderInventory, reserveOrderInventory } from '../services/payment-finalization.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { supabaseAdmin } from '../config/supabase';
import { PaymentMethod } from '@galaxy/constants';
import { CheckoutRequestSchema, RazorpayVerificationRequestSchema } from '@galaxy/types';

const orderService = new OrderService();

export async function createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CheckoutRequestSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message || 'Invalid checkout request', 400));
    const body = parsed.data;
    const productIds = [...new Set(body.items.map((item) => item.productId))];

    const [productsResult, inventoryResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('id, name, sku, hsn_code, tax_rate, price, pricing_type, minimum_order_quantity, weight_grams, is_active, is_purchasable')
        .in('id', productIds),
      supabaseAdmin
        .from('inventory')
        .select('product_id, quantity, reserved_quantity')
        .in('product_id', productIds)
    ]);
    if (productsResult.error) throw new AppError('Failed to validate checkout products', 500);
    if (inventoryResult.error) throw new AppError('Failed to validate checkout inventory', 500);

    const checkout = buildAuthoritativeCheckout(
      body.items,
      (productsResult.data || []) as CheckoutProduct[],
      (inventoryResult.data || []) as CheckoutInventory[]
    );

    // Existing guest profile contract; customer authentication is outside Sprint 4A.
    const guestUserId = 'f870b9e4-88e1-4cdc-960f-ea02f3329806';
    const order = await orderService.createDraftOrder({
      user_id: guestUserId,
      subtotal: checkout.subtotal,
      tax_amount: checkout.taxAmount,
      shipping_amount: checkout.shippingAmount,
      discount_amount: 0,
      total_amount: checkout.totalAmount,
      currency: checkout.currency,
      customer_notes: `Contact: ${body.contact.name} | ${body.contact.email} | ${body.contact.phone}`
    });

    const orderItemsResult = await supabaseAdmin.from('order_items').insert(
      checkout.items.map((item) => ({ ...item, order_id: order.id }))
    );
    if (orderItemsResult.error) throw new AppError('Order was created, but its items could not be saved', 500);

    const addressResult = await supabaseAdmin.from('order_addresses').insert({
      order_id: order.id,
      address_type: 'SHIPPING',
      full_name: body.shipping.fullName,
      phone: body.shipping.phone,
      address_line_1: body.shipping.addressLine1,
      address_line_2: body.shipping.addressLine2 || null,
      city: body.shipping.city,
      state: body.shipping.state,
      postal_code: body.shipping.pincode,
      country: 'India'
    });
    if (addressResult.error) throw new AppError('Order was created, but its shipping address could not be saved', 500);

    await reserveOrderInventory(order.id);

    let razorpayOrder: { id: string };
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: checkout.amountInPaise,
        currency: checkout.currency,
        receipt: order.order_number,
        notes: {
          orderId: order.id,
          customerName: body.contact.name,
          customerEmail: body.contact.email
        }
      });

      const paymentResult = await supabaseAdmin
        .from('payments')
        .insert(buildPendingRazorpayPayment(order.id, razorpayOrder.id, checkout.totalAmount, checkout.currency))
        .select('id')
        .single();
      if (paymentResult.error || !paymentResult.data) {
        throw new AppError('Payment order was created, but its internal binding could not be saved', 500);
      }
    } catch (error) {
      await releaseOrderInventory(order.id);
      throw error;
    }

    sendSuccess(res, {
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId: razorpayOrder.id,
        amount: checkout.totalAmount,
        amountInPaise: checkout.amountInPaise,
        currency: checkout.currency,
        keyId: env.RAZORPAY_KEY_ID,
        contact: body.contact
      },
      message: 'Checkout initiated',
      statusCode: 201
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = RazorpayVerificationRequestSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(parsed.error.issues[0]?.message || 'Invalid payment verification request', 400));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parsed.data;

    const mappingResult = await supabaseAdmin
      .from('payments')
      .select('id, order_id, status, amount, currency, transaction_id, gateway_reference')
      .eq('payment_method', PaymentMethod.GATEWAY)
      .eq('gateway_reference', razorpay_order_id)
      .maybeSingle();
    if (mappingResult.error) throw new AppError('Failed to resolve the payment order mapping', 500);
    const mapping = requirePaymentMapping(
      mappingResult.data as PaymentMapping | null,
      razorpay_order_id,
      orderId
    );
    if (!env.RAZORPAY_KEY_SECRET) throw new AppError('Payment verification is not configured', 500);
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, env.RAZORPAY_KEY_SECRET)) {
      throw new AppError('Payment verification failed', 400);
    }

    const razorpayPayment = await getRazorpay().payments.fetch(razorpay_payment_id);
    assertRazorpayPaymentFacts(razorpayPayment, {
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      amount: Number(mapping.amount),
      currency: mapping.currency
    });

    let finalization;
    try {
      finalization = await finalizeRazorpayPayment(mapping, razorpay_payment_id);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 503) {
        sendSuccess(res, {
          data: {
            orderId: mapping.order_id,
            paymentId: razorpay_payment_id,
            status: 'processing',
            recoverable: true
          },
          message: 'Payment was captured and is awaiting internal confirmation',
          statusCode: 202
        });
        return;
      }
      throw error;
    }
    sendSuccess(res, {
      data: finalization,
      message: finalization.replay ? 'Payment was already verified' : 'Payment verified and order confirmed'
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRazorpayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.header('x-razorpay-signature') || '';
    if (!rawBody || !env.RAZORPAY_WEBHOOK_SECRET) {
      throw new AppError('Razorpay webhook verification is not configured', 503);
    }
    if (!verifyRazorpayWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
      throw new AppError('Invalid Razorpay webhook signature', 400);
    }

    const event = typeof req.body?.event === 'string' ? req.body.event : '';
    if (event === 'payment.failed') {
      sendSuccess(res, { data: { received: true, action: 'none' }, message: 'Failed attempt acknowledged; reservation retained' });
      return;
    }
    if (event !== 'payment.captured' && event !== 'order.paid') {
      sendSuccess(res, { data: { received: true, action: 'ignored' }, message: 'Webhook event ignored' });
      return;
    }

    const paymentId = req.body?.payload?.payment?.entity?.id;
    if (typeof paymentId !== 'string' || !paymentId) throw new AppError('Razorpay webhook payment is missing', 400);

    const razorpayPayment = await getRazorpay().payments.fetch(paymentId);
    const razorpayOrderId = razorpayPayment.order_id;
    if (typeof razorpayOrderId !== 'string' || !razorpayOrderId) throw new AppError('Razorpay payment order is missing', 400);

    const mappingResult = await supabaseAdmin
      .from('payments')
      .select('id, order_id, status, amount, currency, transaction_id, gateway_reference')
      .eq('payment_method', PaymentMethod.GATEWAY)
      .eq('gateway_reference', razorpayOrderId)
      .maybeSingle();
    if (mappingResult.error) throw new AppError('Failed to resolve the payment order mapping', 503);
    const mapping = requirePaymentMapping(mappingResult.data as PaymentMapping | null, razorpayOrderId);
    assertRazorpayPaymentFacts(razorpayPayment, {
      paymentId,
      razorpayOrderId,
      amount: Number(mapping.amount),
      currency: mapping.currency
    });

    const finalization = await finalizeRazorpayPayment(mapping, paymentId);
    sendSuccess(res, {
      data: finalization,
      message: finalization.replay ? 'Webhook replay acknowledged' : 'Payment finalized'
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, status, payment_status, created_at, placed_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new AppError('Failed to retrieve order status', 500);
    if (!order) return next(new AppError('Order not found', 404));

    sendSuccess(res, {
      data: {
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        placedAt: order.placed_at || order.created_at
      },
      message: 'Order status retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}
