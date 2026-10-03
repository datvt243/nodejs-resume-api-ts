/**
 * CV-wide utility endpoints that aren't a candidate CRUD section — today
 * just the ATS self-check. Mounted at `/api/v1/cv` behind `verifyToken`
 * (see `routers/api/v1/index.ts`).
 */
import express from 'express';
const router = express.Router();

import { fnAtsCheck } from '@/candidate_me/ats-check';

/**
 * @swagger
 * /api/v1/cv/ats-check:
 *   post:
 *     tags: [CV]
 *     summary: Render the authenticated candidate's CV in memory and score it against ATS-safety checks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template:
 *                 type: string
 *                 enum: [ats, classic]
 *                 default: ats
 *                 description: Which template to render and check. `classic` is expected to score lower — it isn't ATS-optimized.
 *               lang:
 *                 type: string
 *                 enum: [vi, en]
 *                 default: vi
 *               jobDescription:
 *                 type: string
 *                 description: Optional job description text to score keyword coverage against
 *     responses:
 *       200:
 *         description: ATS self-check report
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
 *                         score: { type: number, description: 'Weighted pass rate, 0-100' }
 *                         pages: { type: number }
 *                         checks:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               passed: { type: boolean }
 *                               severity: { type: string, enum: [error, warning] }
 *                               message: { type: string }
 *                         extractedText: { type: string }
 *                         keywordMatch:
 *                           type: object
 *                           properties:
 *                             matched: { type: array, items: { type: string } }
 *                             missing: { type: array, items: { type: string } }
 *                             coverage: { type: number }
 */
router.post('/ats-check', fnAtsCheck);

export default router;
