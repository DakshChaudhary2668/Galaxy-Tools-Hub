import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof AppError ? err.errors : undefined;

  logger.error(message, {
    requestId: req.requestId,
    stack: err.stack,
    path: req.path
  });

  sendError(res, message, statusCode, errors);
}
