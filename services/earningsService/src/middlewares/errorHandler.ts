import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/errors.js';

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found.',
    status: 404,
  });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      status: err.status,
    });
    return;
  }

  console.error('Unhandled earnings service error', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
    status: 500,
  });
};
