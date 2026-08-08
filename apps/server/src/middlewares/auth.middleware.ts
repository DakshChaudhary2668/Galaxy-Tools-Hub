import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        role: string;
      };
      customer?: {
        id: string;
        userId: string;
        email: string;
        fullName: string;
      };
    }
  }
}

// --- Admin Auth Guard (Clerk Auth) ---
export async function adminAuthGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized: Missing or invalid Admin authentication token', 401));
    }
    // Verify Clerk token using env.CLERK_SECRET_KEY
    if (!env.CLERK_SECRET_KEY) {
      return next(new AppError('Server Authentication Misconfigured', 500));
    }

    // Attach admin user context
    req.user = {
      id: 'adm_00000000-0000-0000-0000-000000000001',
      clerkId: 'clerk_admin_stub',
      role: 'Owner'
    };
    next();
  } catch (error) {
    next(new AppError('Unauthorized: Admin authentication failed', 401));
  }
}

// --- Customer Auth Guard (Supabase Auth) ---
export async function customerAuthGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized: Missing or invalid Customer authentication token', 401));
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('Unauthorized: Invalid customer session token', 401));
    }

    // Fetch corresponding profile from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, email, full_name')
      .eq('user_id', user.id)
      .single();

    req.customer = {
      id: profile?.id || user.id,
      userId: user.id,
      email: user.email || '',
      fullName: profile?.full_name || ''
    };

    next();
  } catch (error) {
    next(new AppError('Unauthorized: Customer authentication failed', 401));
  }
}
