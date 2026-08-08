import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { apiRouter } from './routes';

export function createServer(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(morgan('combined'));

  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
}
