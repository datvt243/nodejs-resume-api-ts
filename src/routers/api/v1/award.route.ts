/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response, NextFunction } from 'express';
import { Collections } from '@/types/base.type';
import { baseDelete, baseGetAll } from '@/candidate_profile/BaseController';
import { fnCreate, fnUpdate } from '@/candidate_profile/awards/award.controller';

const router = express.Router();

/**
 * @swagger
 * /api/v1/award:
 *   get:
 *     tags: [Award]
 *     summary: List all awards for the authenticated candidate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of awards
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Award'
 */
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    req.body.collection = Collections.AWARD;
    next();
  },
  baseGetAll,
);

/**
 * @swagger
 * /api/v1/award/create:
 *   post:
 *     tags: [Award]
 *     summary: Create a new award entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Award'
 *     responses:
 *       201:
 *         description: Award created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 */
router.post('/create', fnCreate);

/**
 * @swagger
 * /api/v1/award/update:
 *   put:
 *     tags: [Award]
 *     summary: Update an existing award entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Award'
 *     responses:
 *       200:
 *         description: Award updated
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
 * /api/v1/award/delete/{id}:
 *   delete:
 *     tags: [Award]
 *     summary: Delete an award entry by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Award deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete(
  '/delete/:id',
  (req: Request, res: Response, next: NextFunction) => {
    req.params.collection = Collections.AWARD;
    next();
  },
  baseDelete,
);

export default router;
