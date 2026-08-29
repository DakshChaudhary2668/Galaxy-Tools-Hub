import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

export interface CustomerListItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
}

export async function getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, user_id, full_name, email, phone, avatar_url, is_active, created_at, updated_at', { count: 'exact' })
      .eq('account_type', 'CUSTOMER');

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      const isActive = req.query.status === 'active';
      query = query.eq('is_active', isActive);
    }

    // Search query
    if (req.query.search && typeof req.query.search === 'string') {
      const s = req.query.search.trim();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
    }

    // Filter by new customers
    if (req.query.filter === 'new') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', thirtyDaysAgo);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: profiles, count, error } = await query;
    if (error) throw new Error(error.message);

    // Fetch order stats for these profiles
    const userIds = (profiles || []).map((p) => p.user_id).filter(Boolean);
    const orderStatsMap: Record<string, { count: number; totalSpent: number; lastOrder: string | null }> = {};

    if (userIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('user_id, total_amount, payment_status, created_at')
        .in('user_id', userIds);

      (orders || []).forEach((ord: { user_id?: string; total_amount?: number; payment_status?: string; created_at?: string }) => {
        if (!ord.user_id) return;
        if (!orderStatsMap[ord.user_id]) {
          orderStatsMap[ord.user_id] = { count: 0, totalSpent: 0, lastOrder: null };
        }
        orderStatsMap[ord.user_id].count += 1;
        if (ord.payment_status === 'PAID') {
          orderStatsMap[ord.user_id].totalSpent += Number(ord.total_amount) || 0;
        }
        if (
          !orderStatsMap[ord.user_id].lastOrder ||
          (ord.created_at && new Date(ord.created_at) > new Date(orderStatsMap[ord.user_id].lastOrder!))
        ) {
          orderStatsMap[ord.user_id].lastOrder = ord.created_at || null;
        }
      });
    }

    let customerList: CustomerListItem[] = (profiles || []).map((p) => {
      const stats = orderStatsMap[p.user_id] || { count: 0, totalSpent: 0, lastOrder: null };
      return {
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || 'Customer',
        email: p.email,
        phone: p.phone,
        avatar_url: p.avatar_url,
        is_active: p.is_active,
        orders_count: stats.count,
        total_spent: stats.totalSpent,
        last_order_at: stats.lastOrder,
        created_at: p.created_at
      };
    });

    // High value customer filter (client-sorted / filtered if requested)
    if (req.query.filter === 'high_value') {
      customerList = customerList.filter((c) => c.total_spent >= 10000);
    }

    const total = count || customerList.length;
    const totalPages = Math.ceil(total / limit) || 1;

    sendSuccess(res, {
      data: customerList,
      message: 'Customers retrieved successfully',
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customerId = req.params.id;

    // Fetch customer profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, full_name, email, phone, avatar_url, is_active, created_at, updated_at')
      .or(`id.eq.${customerId},user_id.eq.${customerId}`)
      .single();

    if (profErr || !profile) {
      return next(new AppError('Customer not found', 404));
    }

    // Fetch addresses
    const { data: addresses } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('is_default', { ascending: false });

    // Fetch customer orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total_amount, payment_status, status, created_at')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    const orderList = orders || [];
    const totalOrders = orderList.length;
    const totalSpent = orderList
      .filter((o: any) => o.payment_status === 'PAID')
      .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const lastOrderAt = orderList[0]?.created_at || null;

    sendSuccess(res, {
      data: {
        profile,
        stats: {
          total_orders: totalOrders,
          total_spent: totalSpent,
          average_order_value: averageOrderValue,
          last_order_at: lastOrderAt
        },
        orders: orderList,
        addresses: addresses || []
      },
      message: 'Customer details retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleCustomerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customerId = req.params.id;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return next(new AppError('is_active boolean is required', 400));
    }

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: Boolean(is_active), updated_at: new Date().toISOString() })
      .or(`id.eq.${customerId},user_id.eq.${customerId}`)
      .select()
      .single();

    if (error) throw new Error(error.message);

    sendSuccess(res, {
      data: updated,
      message: `Customer is now ${is_active ? 'Active' : 'Inactive'}`
    });
  } catch (error) {
    next(error);
  }
}
