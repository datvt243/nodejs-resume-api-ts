/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import express, { Request, Response } from 'express';

const router = express.Router();

import { fnGetAboutMe, fnRecordVisit } from '@/candidate_me';
import { fnSearchPublicProfiles } from '@/candidate_me/search';
import routerAPI from './api/v1/index';
import routerAPIV2 from './api/v2/index';

router.use('/api/v1', routerAPI);
router.use('/api/v2', routerAPIV2);

/**
 * @swagger
 * /api/me/search:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Search public candidate profiles by keyword (skill, position, company, school, major), no auth required
 *     description: Case-insensitive substring match over GeneralInformation positionDesired/professionalSkills, Experience company/position/skills and Education school/major. Only candidates whose profile is public and who have a vanity slug are returned; each result carries only public fields and links to /api/me/{slug}. Must stay registered before /api/me/{email} — a slug literally "search" is shadowed by this route.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching public profiles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               slug: { type: string }
 *                               firstName: { type: string }
 *                               lastName: { type: string }
 *                               positionDesired: { type: string }
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page: { type: integer }
 *                             limit: { type: integer }
 *                             total: { type: integer }
 *                             totalPages: { type: integer }
 *       400:
 *         description: Missing, too short (< 2) or too long (> 100) query
 */
router.get('/api/me/search', fnSearchPublicProfiles);

/**
 * @swagger
 * /api/me/{email}:
 *   get:
 *     tags: [CandidateMe]
 *     summary: Get a candidate's full public profile (CV) by vanity slug or email (slug checked first, email as fallback for existing shared links), no auth required
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Vanity slug (e.g. `jane-doe-ab12`) or registration email
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [vi, en]
 *           default: vi
 *         description: Language to resolve localized free-text fields (introduction, section descriptions, career/careerGoal) into. Falls back to whichever language has content if the requested one is empty.
 *       - in: query
 *         name: profile
 *         required: false
 *         schema:
 *           type: string
 *         description: CV profile id (see /api/v1/profile) — when given, filters each CV section down to the ids listed on that profile. Omitted, or an id that doesn't resolve to a profile owned by this candidate, returns every section unfiltered (existing share-links unaffected).
 *     responses:
 *       200:
 *         description: Aggregated public profile (candidate + general information + all CV sections, optionally filtered by ?profile=)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Email not found
 */
router.get('/api/me/:email', fnGetAboutMe);

/**
 * @swagger
 * /api/me/{email}/visit:
 *   post:
 *     tags: [CandidateMe]
 *     summary: Record a visit to a candidate's public profile (count, timestamp, IP, geo-location), no auth required
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Visit recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Email not found
 */
router.post('/api/me/:email/visit', fnRecordVisit);

router.get('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    errors: null,
    data: null,
  });
});

router.get('/*', (_req: Request, res: Response) => {
  res.send(
    `<div style="text-align: center; padding: 50px">
            <h1 style="font-size: 8vw; text-transform: uppercase; letter-spacing: .1em;">Hello World!</h1> 
            <br/>
            <p>Go to <a href="https://datvt243.github.io/vue-resume-web/">Resume Web Page</a></p>
        </div>`,
  );
});

export default router;
