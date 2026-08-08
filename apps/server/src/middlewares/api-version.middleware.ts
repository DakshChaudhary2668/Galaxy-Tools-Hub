import { Request, Response, NextFunction } from 'express';

export function apiVersionMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-API-Version', 'v1');
  next();
}
