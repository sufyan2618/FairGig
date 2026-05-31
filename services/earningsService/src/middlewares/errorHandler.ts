import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('endpoint not found', {
    event: 'not_found',
    method: req.method,
    path: req.originalUrl,
  });

  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found.',
    status: 404,
  });
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.warn('application error', {
      event: 'app_error',
      method: req.method,
      path: req.originalUrl,
      error_code: err.code,
      status: err.status,
      message: err.message,
    });

    res.status(err.status).json({
      error: err.code,
      message: err.message,
      status: err.status,
    });
    return;
  }

  logger.error('unhandled earnings service error', err, {
    event: 'unhandled_error',
    method: req.method,
    path: req.originalUrl,
  });

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
    status: 500,
  });
};
