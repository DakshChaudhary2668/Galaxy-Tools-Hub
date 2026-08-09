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

// --- Admin Auth Guard (Clerk JWT verification) ---
// TODO: wire real Clerk JWT verification using @clerk/express verifyToken() before release.
// Until implemented all admin routes correctly return 501.
export async function adminAuthGuard(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  next(new AppError('Admin authentication not configured.', 501));
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
