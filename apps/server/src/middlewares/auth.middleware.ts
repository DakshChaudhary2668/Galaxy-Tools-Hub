import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { supabaseAdmin } from '../config/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId?: string;
        email?: string;
        name?: string;
        role: string;
        status?: string;
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

export async function adminAuthGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const match = req.headers.authorization?.trim().match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      return next(new AppError('Unauthorized: Missing or invalid admin authentication token', 401));
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(match[1]);
    if (authError || !authData.user) {
      return next(new AppError('Unauthorized: Invalid or expired admin session token', 401));
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, user_id, name, email, role, status')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (adminError) {
      return next(new AppError('Unable to verify admin permissions', 500));
    }
    if (!adminUser) {
      return next(new AppError('Forbidden: Admin permission required', 403));
    }
    if (adminUser.status !== 'ACTIVE') {
      return next(new AppError('Forbidden: Admin account is not active', 403));
    }

    req.user = {
      id: adminUser.id,
      userId: adminUser.user_id,
      email: adminUser.email || authData.user.email,
      name: adminUser.name,
      role: adminUser.role,
      status: adminUser.status
    };
    return next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Unable to verify admin authentication', 500));
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
