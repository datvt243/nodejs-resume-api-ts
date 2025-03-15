/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
const router = express.Router();

import { authRegister, authLogin } from '@/api/v1/auth/controllers/index';

router.post('/register', authRegister);
router.get('/login', authLogin);

export default router;
