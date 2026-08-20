import logger from './winston';
import { Request } from 'express';

export * from './winston';

// Backward compatibility with existing _log calls
export const _log = (props: any) => {
  if (!props) return;

  if (typeof props === 'string') {
    return logger.info(props);
  }

  if (Array.isArray(props)) {
    props.forEach((item) => logger.info(item));
    return;
  }

  const { text = '', type = 'info' } = typeof props === 'object' ? props : { text: props };
  const level = ['warn', 'error', 'table'].includes(type) ? (type as 'warn' | 'error') : 'info';

  (logger as any)[level](text);
};

// Error logging helper
export const logCatchError = (err: Error) => {
  logger.error('Caught error', { error: err.message, stack: err.stack });
};

// Request helper (adds req context)
export const logRequest = (req: Request, message: string, extra: Record<string, any> = {}) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: (req as any).get ? (req as any).get('User-Agent') : 'unknown',
    ...extra,
  });
};

export { logger };
