/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import logger from './winston';
import { Request } from 'express';

export * from './winston';

type LogLevel = 'info' | 'warn' | 'error';
type LogEntry = { text?: unknown; type?: string; [key: string]: unknown };
type LogPayload = string | unknown[] | LogEntry;

const resolveLevel = (type: unknown): LogLevel => (type === 'error' ? 'error' : type === 'warn' || type === 'table' ? 'warn' : 'info');

// Backward compatibility with existing _log calls
export const _log = (props: LogPayload) => {
  if (!props) return;

  if (typeof props === 'string') {
    return logger.info(props);
  }

  if (Array.isArray(props)) {
    props.forEach((item) => logger.info(typeof item === 'string' ? item : JSON.stringify(item)));
    return;
  }

  const { text = '', type = 'info' } = props;
  const level = resolveLevel(type);
  const message = typeof text === 'string' ? text : JSON.stringify(text);

  logger[level](message);
};

export const logCatchError = (err: Error) => {
  logger.error('Caught error', { error: err.message, stack: err.stack });
};

export const logRequest = ({
  req,
  message,
  extra = {},
}: {
  req: Request;
  message: string;
  extra?: Record<string, unknown>;
}) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get ? req.get('User-Agent') : 'unknown',
    ...extra,
  });
};

export { logger };
