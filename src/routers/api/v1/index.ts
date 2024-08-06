/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import path, { dirname } from 'path';
import express from 'express';
import { verifyToken, verifyTokenByQuery } from '@/middlewares/verifyToken.middleware';

const router = express.Router();

import routeAuth from './auth.route';
import routeCandidate from './candidate.route';
import routeEducation from './education.route';
import routeExperience from './experience.route';
import routeReference from './reference.route';
import routeGeneralInformation from './generalInformation.route';
import routeProject from './project.route';
import routeCertificate from './certificate.route';
import routeAward from './award.route';
import { fnExportPDF } from '@/candidate_me/index';

router.use('/auth', routeAuth);
router.use('/candidate', verifyToken, routeCandidate);
router.use('/education', verifyToken, routeEducation);
router.use('/award', verifyToken, routeAward);
router.use('/experience', verifyToken, routeExperience);
router.use('/reference', verifyToken, routeReference);
router.use('/general-information', verifyToken, routeGeneralInformation);
router.use('/project', verifyToken, routeProject);
router.use('/certificate', verifyToken, routeCertificate);
router.get('/download-pdf', verifyTokenByQuery, fnExportPDF);

router.get('/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Page not found',
        errors: null,
        data: null,
    });
});

export default router;
