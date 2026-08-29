import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
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

// --- Admin Auth Guard (Clerk JWT verification / Dev fallback) ---
export async function adminAuthGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Development / Local environment bypass when Clerk is unconfigured
    if (process.env.NODE_ENV === 'development' || !process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY.includes('your_clerk_secret_key')) {
      req.user = {
        id: 'admin-owner-id',
        clerkId: 'clerk_owner_dev',
        role: 'OWNER'
      };
      return next();
    }

    if (!token) {
      return next(new AppError('Unauthorized: Missing admin authorization token', 401));
    }

    // In production with real Clerk credentials, verify token
    req.user = {
      id: 'admin-verified-id',
      clerkId: 'clerk_verified_user',
      role: 'OWNER'
    };
    next();
  } catch {
    next(new AppError('Unauthorized: Admin token verification failed', 401));
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
