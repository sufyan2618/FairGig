import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import type { Request, Response } from 'express';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import internalRouter from './routers/internalRouter.js';
import shiftRouter from './routers/shiftRouter.js';
import verificationRouter from './routers/verificationRouter.js';

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

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        service: 'earnings-service',
    });
});

app.use('/api', router);
app.use('/api/earnings', shiftRouter);
app.use('/api/earnings', verificationRouter);
app.use('/api/earnings', internalRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
    console.log(`Earnings service is running on port ${env.port}`);
});




