import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

export function getHealth(_req: Request, res: Response): void {
  const healthData = {
    status: 'UP',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };

  sendSuccess(res, { data: healthData, message: 'Galaxy Tools Hub API is healthy' });
}
