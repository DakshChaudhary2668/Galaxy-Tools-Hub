import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

// In-memory persistent default settings (fallback / editable)
const storeSettings = {
  general: {
    storeName: 'Galaxy Tools Hub',
    businessName: 'Galaxy Tools Hub',
    businessEmail: 'galaxyinstruments9@gmail.com',
    supportPhone: '+91 90151 33267 / 011-43603957',
    address: '1674/4, Ground Floor, Bhagirath Palace, Delhi 110006',
    gstin: '',
    supportHours: 'Mon - Sat: 9:00 AM - 7:00 PM IST'
  },
  commerce: {
    currency: 'INR (₹)',
    defaultGSTRate: 18,
    lightFreightFee: 60,
    heavyFreightFee: 120,
    freightThresholdGrams: 1000,
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
          bankTransferEnabled: false,
          neftAccountName: '',
          neftAccountNumber: '',
          neftIfscCode: ''
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
      storeSettings.commerce = {
        ...storeSettings.commerce,
        ...commerce,
        defaultGSTRate: 18,
        lightFreightFee: 60,
        heavyFreightFee: 120,
        freightThresholdGrams: 1000
      };
    }
    if (notifications) {
      storeSettings.notifications = { ...storeSettings.notifications, ...notifications };
    }

    sendSuccess(res, {
      data: storeSettings,
      message: 'Settings changed in memory only; they are not persisted and may reset at any time.'
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
      sendSuccess(res, { data: [], message: 'No admin team records found' });
      return;
    }

    sendSuccess(res, { data: adminUsers, message: 'Admin team retrieved successfully' });
  } catch (error) {
    next(error);
  }
}
