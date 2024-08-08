/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/education/education.controller';

const router = express.Router();

router.get(
    '/',
    (req: Request, res: Response, next: NextFunction) => {
        req.body.collection = Collections.EDUCATION;
        next();
    },
    baseGetAll,
);
router.post('/create', fnCreate);
router.put('/update', fnUpdate);
router.delete(
    '/delete/:id',
    (req: Request, res: Response, next: NextFunction) => {
        req.params.collection = Collections.EDUCATION;
        next();
    },
    baseDelete,
);

export default router;
