import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Each product image must be 5MB or smaller.',
      LIMIT_FILE_COUNT: 'You can upload up to 6 product images.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected upload field. Product images must be sent as images.',
    };

    logger.warn(err.message, { code: err.code, path: req.originalUrl });
    return res.status(400).json({ error: messages[err.code] ?? 'Invalid product image upload.' });
  }

  const statusCode = err instanceof AppError ? err.statusCode : err.statusCode || 500;

  logger.error(err.message, { stack: err.stack, path: req.originalUrl });

  // Never leak stack traces or internal details to the client.
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Something went wrong. Please try again later.' : err.message,
  });
}
