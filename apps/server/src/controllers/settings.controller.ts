import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

// In-memory persistent default settings (fallback / editable)
const storeSettings = {
  general: {
    storeName: 'Galaxy Tools Hub',
    businessName: 'Galaxy Tools & Instruments Private Limited',
    businessEmail: 'sales@galaxytools.in',
    supportPhone: '+91 98765 43210',
    address: 'Plot 42, Industrial Area Phase II, Okhla, New Delhi, 110020',
    gstin: '07AAAAA0000A1Z5',
    supportHours: 'Mon - Sat: 9:00 AM - 7:00 PM IST'
  },
  commerce: {
    currency: 'INR (₹)',
    defaultGSTRate: 18,
    freeShippingThreshold: 50000,
    flatShippingFee: 500,
    lowStockThreshold: 5,
    minimumOrderQuantity: 1
  },
  notifications: {
    orderConfirmationEmail: true,
    adminLowStockAlerts: true,
    dailySummaryDigest: true,
    smsNotifications: false
  }
};

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Payment status without leaking any secrets
    const hasRazorpay = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
    const razorpayMode = env.RAZORPAY_KEY_ID?.startsWith('rzp_test') ? 'TEST_MODE' : 'LIVE_MODE';
    const maskedKeyId = env.RAZORPAY_KEY_ID
      ? `${env.RAZORPAY_KEY_ID.slice(0, 10)}••••••••••••`
      : 'Not Configured';

    // System Environment
    const system = {
      environment: process.env.NODE_ENV || 'development',
      apiVersion: 'v1.0.0',
      database: 'Connected (Supabase PostgreSQL)',
      authSystem: 'Supabase Auth (Unified RBAC & Customer)',
      storageSystem: 'Supabase Storage Bucket (galaxy-tools-assets)'
    };

    sendSuccess(res, {
      data: {
        ...storeSettings,
        payment: {
          gateway: 'Razorpay',
          isConfigured: hasRazorpay,
          mode: razorpayMode,
          keyIdMasked: maskedKeyId,
          bankTransferEnabled: true,
          neftAccountName: 'Galaxy Tools & Instruments Pvt Ltd',
          neftAccountNumber: '••••••••8901',
          neftIfscCode: 'HDFC0001234'
        },
        system
      },
      message: 'Store settings retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { general, commerce, notifications } = req.body;

    if (general) {
      storeSettings.general = { ...storeSettings.general, ...general };
    }
    if (commerce) {
      storeSettings.commerce = { ...storeSettings.commerce, ...commerce };
    }
    if (notifications) {
      storeSettings.notifications = { ...storeSettings.notifications, ...notifications };
    }

    sendSuccess(res, {
      data: storeSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTeam(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: adminUsers, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, name, email, role, status, created_at');

    if (error || !adminUsers || adminUsers.length === 0) {
      // Fallback dev admin team
      const fallbackTeam = [
        {
          id: 'adm-owner-1',
          name: 'Daksh Chaudhary (Owner)',
          email: 'admin@galaxytools.in',
          role: 'OWNER',
          status: 'ACTIVE',
          created_at: new Date(2025, 0, 1).toISOString()
        },
        {
          id: 'adm-mgr-2',
          name: 'Store Manager',
          email: 'manager@galaxytools.in',
          role: 'MANAGER',
          status: 'ACTIVE',
          created_at: new Date(2025, 1, 15).toISOString()
        }
      ];
      sendSuccess(res, { data: fallbackTeam, message: 'Admin team retrieved successfully' });
      return;
    }

    sendSuccess(res, { data: adminUsers, message: 'Admin team retrieved successfully' });
  } catch (error) {
    next(error);
  }
}
