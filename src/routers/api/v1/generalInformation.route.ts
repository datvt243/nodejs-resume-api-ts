/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';
import { fnGet, fnCreate, fnUpdate, fnUpdateFields } from '@/candidate_profile/general_information/generalInformation.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/general-information:
 *   get:
 *     tags: [GeneralInformation]
 *     summary: Get general information for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: General information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GeneralInformation'
 */
router.get('/', fnGet);

/**
 * @swagger
 * /api/v1/general-information/create:
 *   post:
 *     tags: [GeneralInformation]
 *     summary: Create general information (one per candidate)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralInformation'
 *     responses:
 *       201:
 *         description: General information created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error, or candidate already has general information
 */
router.post('/create', fnCreate);

/**
 * @swagger
 * /api/v1/general-information/update:
 *   put:
 *     tags: [GeneralInformation]
 *     summary: Fully replace general information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralInformation'
 *     responses:
 *       200:
 *         description: General information updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.put('/update', fnUpdate);

/**
 * @swagger
 * /api/v1/general-information/update:
 *   patch:
 *     tags: [GeneralInformation]
 *     summary: Partially update general information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneralInformation'
 *     responses:
 *       200:
 *         description: General information updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.patch('/update', fnUpdateFields);

export default router;
