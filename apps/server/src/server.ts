import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { apiVersionMiddleware } from './middlewares/api-version.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { apiRouter } from './routes';

export function createServer(): express.Application {
  const app = express();

  // Security Headers & CORS
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  // JSON Parsing limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request ID & Version headers
  app.use(requestIdMiddleware);
  app.use(apiVersionMiddleware);

  // Rate Limiting (200 requests per 15 minutes)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      errors: ['Rate limit exceeded']
    }
  });
  app.use('/api', limiter);

  // Custom Morgan Format: Method, URL, Status, Response Time, Request ID (Sanitized: No Auth/Secrets logged)
  morgan.token('req-id', (req: express.Request) => (req as unknown as { requestId?: string }).requestId || '-');
  app.use(morgan(':method :url :status :response-time ms - req-id: :req-id'));

  // Health endpoint at root
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Galaxy Tools Hub API is healthy',
      data: {
        status: 'UP',
        version: '1.0.0',
        environment: env.NODE_ENV,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  });

  // API v1 Router
  app.use('/api/v1', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
