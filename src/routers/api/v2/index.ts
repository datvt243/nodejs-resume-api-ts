/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express from 'express';

const router = express.Router();

import routeAuth from './auth.route';

router.use('/auth', routeAuth);

router.get('/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    errors: null,
    data: null,
  });
});

export default router;
