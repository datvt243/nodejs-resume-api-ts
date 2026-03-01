import { Request, Response, NextFunction } from 'express';
import { _log } from '@/utils';

/**
 * Simple request logging middleware. Logs method, URL and response time.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    _log(`${method} ${originalUrl} ${status} - ${duration}ms`);
  });

  next();
};

export default requestLogger;
