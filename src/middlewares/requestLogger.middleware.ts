import { Request, Response, NextFunction } from 'express';
import { _log } from '@/utils';

/**
 * Structured request logging middleware with Winston
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    _log(`${req.method} ${req.originalUrl} ${status} - ${duration}ms`);
  });

  next();
};

export default requestLogger;
