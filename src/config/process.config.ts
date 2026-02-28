/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import 'dotenv/config';

const ENV_KEYS = [
  'NODE_ENV',
  'LOCAL_PORT',
  'MONGOBD_USER',
  'MONGOBD_PASSWORD',
  'SESSION_SECRET',
  'TOKEN_SECRET',
  'TOKEN_REFRESH',
  'TOKEN_EXP_IN',
];

// Validate required environment variables
const requiredEnvVars = ['MONGOBD_USER', 'MONGOBD_PASSWORD', 'TOKEN_SECRET', 'TOKEN_REFRESH', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
}

const { NODE_ENV, LOCAL_PORT, MONGOBD_USER, MONGOBD_PASSWORD, SESSION_SECRET, TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN } =
  process.env;

export { NODE_ENV, LOCAL_PORT, MONGOBD_USER, MONGOBD_PASSWORD, SESSION_SECRET, TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN };
