/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
import { fnGet, fnCreate, fnUpdate, fnUpdateFields } from '@/candidate_profile/general_information/generalInformation.controller';

const router = express.Router();

router.get('/', fnGet);
router.post('/create', fnCreate);
router.put('/update', fnUpdate);
router.patch('/update', fnUpdateFields);

export default router;
