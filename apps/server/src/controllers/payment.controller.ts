import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getRazorpay } from '../config/razorpay';
import { env } from '../config/env';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { supabaseAdmin } from '../config/supabase';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@galaxy/constants';

const orderService = new OrderService();

interface CheckoutItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  sku?: string;
}

interface CheckoutBody {
  items: CheckoutItem[];
  contact: { name: string; email: string; phone: string };
  shipping: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

/**
 * POST /payments/checkout
 * Validates cart, calculates server-side total, creates draft order + Razorpay order.
 */
export async function createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CheckoutBody;

    // Validate items
    if (!body.items || body.items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }
    if (!body.contact?.name || !body.contact?.email || !body.contact?.phone) {
      return next(new AppError('Contact information is required', 400));
    }
    if (!body.shipping?.fullName || !body.shipping?.addressLine1 || !body.shipping?.city || !body.shipping?.state || !body.shipping?.pincode) {
      return next(new AppError('Shipping address is required', 400));
    }

    // Server-side price calculation — never trust client total
    const subtotal = body.items.reduce((sum, item) => {
      if (item.price <= 0 || item.quantity <= 0) throw new AppError('Invalid item price or quantity', 400);
      return sum + item.price * item.quantity;
    }, 0);

    const shippingAmount = subtotal >= 50000 ? 0 : 500;
    const taxAmount = Math.round((subtotal * 18) / 118);
    const totalAmount = subtotal + shippingAmount;

    // ponytail: placeholder UUID for guest checkout — replace with real auth user_id later
    const guestUserId = '00000000-0000-0000-0000-000000000000';

    // Create draft order in DB
    const order = await orderService.createDraftOrder({
      user_id: guestUserId,
      subtotal,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      discount_amount: 0,
      total_amount: totalAmount,
      currency: 'INR',
      customer_notes: `Contact: ${body.contact.name} | ${body.contact.email} | ${body.contact.phone}`,
    });

    // Insert order items
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId || null,
      product_name: item.productName,
      sku: item.sku || item.productId,
      hsn_code: '9030', // ponytail: generic HSN for testing instruments, refine per-product later
      quantity: item.quantity,
      unit_price: item.price,
      discount_amount: 0,
      tax_rate: 18,
      tax_amount: Math.round((item.price * item.quantity * 18) / 118),
      total_amount: item.price * item.quantity,
    }));

    await supabaseAdmin.from('order_items').insert(orderItems);

    // Insert shipping address
    await supabaseAdmin.from('order_addresses').insert({
      order_id: order.id,
      address_type: 'SHIPPING',
      full_name: body.shipping.fullName,
      phone: body.shipping.phone,
      address_line_1: body.shipping.addressLine1,
      address_line_2: body.shipping.addressLine2 || null,
      city: body.shipping.city,
      state: body.shipping.state,
      postal_code: body.shipping.pincode,
      country: 'India',
    });

    // Create Razorpay order
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        orderId: order.id,
        customerName: body.contact.name,
        customerEmail: body.contact.email,
      },
    });

    // Store razorpay order ID on the order
    await supabaseAdmin
      .from('orders')
      .update({
        status: OrderStatus.PENDING_PAYMENT,
        payment_status: PaymentStatus.PENDING,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    sendSuccess(res, {
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        amountInPaise: Math.round(totalAmount * 100),
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
        contact: body.contact,
      },
      message: 'Checkout initiated',
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /payments/verify
 * Verifies Razorpay payment signature and marks order as paid.
 */
export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return next(new AppError('Missing payment verification parameters', 400));
    }

    // HMAC SHA256 signature verification
    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return next(new AppError('Payment verification not configured', 500));
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: PaymentStatus.FAILED, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return next(new AppError('Payment verification failed — signature mismatch', 400));
    }

    // Insert payment record
    await supabaseAdmin.from('payments').insert({
      order_id: orderId,
      payment_method: PaymentMethod.GATEWAY,
      status: PaymentStatus.PAID,
      amount: 0, // ponytail: amount already on order, update from razorpay fetch if needed
      currency: 'INR',
      transaction_id: razorpay_payment_id,
      gateway_reference: razorpay_order_id,
      paid_at: new Date().toISOString(),
    });

    // Mark order as paid (uses existing service which also decrements inventory)
    await orderService.markPaid(orderId);

    sendSuccess(res, {
      data: { orderId, paymentId: razorpay_payment_id, status: 'paid' },
      message: 'Payment verified and order confirmed',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /payments/order-status/:id
 * Public endpoint to fetch order confirmation details without exposing sensitive admin data.
 */
export async function getPublicOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const { data: addresses } = await supabaseAdmin
      .from('order_addresses')
      .select('*')
      .eq('order_id', id)
      .limit(1);

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    sendSuccess(res, {
      data: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        subtotal: order.subtotal,
        taxAmount: order.tax_amount,
        shippingAmount: order.shipping_amount,
        totalAmount: order.total_amount,
        currency: order.currency || 'INR',
        placedAt: order.created_at || order.placed_at || new Date().toISOString(),
        customerNotes: order.customer_notes,
        address: addresses?.[0] || null,
        items: items || [],
      },
      message: 'Order status retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

