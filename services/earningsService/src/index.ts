import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import internalRouter from './routers/internalRouter.js';
import shiftRouter from './routers/shiftRouter.js';
import verificationRouter from './routers/verificationRouter.js';
import { logger, requestLogger } from './utils/logger.js';
import './utils/tracing.js';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  const startMs = performance.now();
  requestLogger(req, res, startMs);
  next();
});

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'earnings-service',
  });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api', router);
app.use('/api/earnings', shiftRouter);
app.use('/api/earnings', verificationRouter);
app.use('/api/earnings', internalRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info('earnings-service started', { event: 'service_start', port: env.port });
});
