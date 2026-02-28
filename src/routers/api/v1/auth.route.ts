/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
const router = express.Router();

import { authRegister, authLogin, authLogout, authRefreshToken } from '@/auth/auth.controller';

router.post('/register', authRegister);
router.get('/login', authLogin);
router.post('/logout', authLogout);
router.post('/refresh', authRefreshToken);

export default router;
