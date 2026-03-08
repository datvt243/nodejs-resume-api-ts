/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
const router = express.Router();

import { authRegister, authLogin, authLogout, authRefreshToken } from '@/auth/auth.controller';
import { createRateLimiter } from '@/middlewares/rateLimit.middleware';

// Apply stricter rate limit for auth routes (e.g., 10 requests per 15 minutes)
const authLimiter = createRateLimiter({ max: 150, windowMs: 15 * 60 * 1000, keyPrefix: 'auth-rl' });
router.use(authLimiter);

router.post('/register', authRegister);
router.get('/login', authLogin);
router.post('/logout', authLogout);
router.post('/refresh', authRefreshToken);

export default router;
