/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
const router = express.Router();

import { fnGetInformationByEmail, fnUpdate, fnUpdateFields } from '@/candidate/candidate.controller';

router.get('/:email', fnGetInformationByEmail);
router.put('/update', fnUpdate);
router.patch('/update', fnUpdateFields);

export default router;
