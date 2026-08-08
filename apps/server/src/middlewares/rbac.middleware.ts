import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { Role } from '@galaxy/constants';

export function rbacGuard(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User context missing', 401));
    }
    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(new AppError('Forbidden: Insufficient role permissions', 403));
    }
    next();
  };
}
