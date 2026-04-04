import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { NODE_ENV, LOG_LEVEL = 'info', LOG_DIR = './logs' } = process.env;

const isProduction = NODE_ENV === 'production';

// Ensure logs directory exists (handled by winston-daily-rotate-file)
const logDir = path.resolve(LOG_DIR);

const consoleTransport = new winston.transports.Console({
  level: LOG_LEVEL,
  format: isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.simple()),
});

const fileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'backend-combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '14d',
  level: LOG_LEVEL,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
});

const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'backend-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '14d',
  level: 'error',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json(), winston.format.errors({ stack: true })),
});

const transports: winston.transport[] = [consoleTransport, fileTransport, errorFileTransport];

const logger = winston.createLogger({
  level: LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'resume-api-backend' },
  transports,
});

export default logger;
