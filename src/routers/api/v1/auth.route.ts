/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
const router = express.Router();

import { authRegister, authLogin } from '@/auth/auth.controller';

router.post('/register', authRegister);
router.post('/login', authLogin);
router.get('/login', authLogin);

export default router;
