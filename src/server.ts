/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Learning nodejs basic
 */
require('module-alias/register');
require('./alias');
import dotenv from 'dotenv';

import path, { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
/* import exitHook from 'exit-hook'; */

import { errorsMiddleware, rateLimitMiddleware, startMemStoreCleanup, requestLogger } from '@/middlewares';
import { sessionConfig, corsConfig } from '@/config';
import { logger } from '@/logger';
import router from '@/routers';
import { initRedis } from '@/services/redis';

dotenv.config();

const runServer = async ({ portNumber }: { portNumber: number }) => {
  const app = express();

  /* const __dirname = dirname(new URL(import.meta.url).pathname); */

  /**
   * request logging
   */
  app.use(requestLogger);

  /**
   * use Session
   */
  app.use(session(sessionConfig()));
  /**
   * use CORS
   */
  app.use(cors(corsConfig()));

  /**
   * use Body-parser
   */
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Health check endpoint (exempt from rate limiting)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * rate limiting (with health exemption)
   */
  app.use(rateLimitMiddleware);

  /**
   * use static-files
   */
  app.use(express.static(path.join(__dirname, 'public')));

  /**
   * use router
   */
  app.use(router);

  /**
   * use middleware
   */
  app.use(errorsMiddleware);

  /**
   * use template-engine
   */
  app.set('view engine', 'pug');
  app.set('views', './views'); /* app.set('views', './view'); */

  /**
   * listen app
   */
  const _env = process.env.NODE_ENV || 'development';
  const _portNumber = _env !== 'production' ? portNumber : 3008;

  // Initialize Redis for token blacklist (non-blocking)
  await initRedis();

  // Start in-memory store cleanup (no-op if Redis is available)
  try {
    startMemStoreCleanup();
  } catch (err) {
    logger.error('[RateLimit] Failed to start memStore cleanup', { err: (err as Error).message, stack: (err as Error).stack });
  }
  app.listen(_portNumber, () => {
    logger.info(`App listening on port: ${_portNumber} - ${_env}`);
  });

  /* exitHook(() => {
        // TODO: close connect mongo (coming soon...)
    }); */
};

/**
 * connect to mongoDB
 */
const { LOCAL_PORT } = process.env;
import connectMongo from '@/database/mongo.db';

const startServer = async () => {
  try {
    const isConnected = await connectMongo();
    isConnected && runServer({ portNumber: parseInt(LOCAL_PORT || '3001', 10) });
  } catch (e) {
    logger.error(`Failed to start server`, { error: (e as Error).message, stack: (e as Error).stack });
  }
};

startServer();
