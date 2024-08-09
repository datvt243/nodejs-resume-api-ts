/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import express, { Request, Response } from 'express';

const router = express.Router();

import { fnGetAboutMe } from '@/candidate_me';
import routerAPI from './api/v1/index';

/**
 * API V1
 */
router.use('/api/v1', routerAPI);

/**
 * get ME
 */
router.get('/api/me/:email', fnGetAboutMe);

/**
 * 404
 */
router.get('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Page not found',
        errors: null,
        data: null,
    });
});

/**
 * get page home
 */
/* router.get('/', (req: Request, res: Response) => {
    res.render('render', { data: null });
}); */
router.get('/*', (req: Request, res: Response) => {
    res.send(
        `<div style="text-align: center; padding: 50px">
            <h1 style="font-size: 8vw; text-transform: uppercase; letter-spacing: .1em;">Hello World!</h1> 
            <br/>
            <p>Go to <a href="https://datvt243.github.io/vue-resume-web/">Resume Web Page</a></p>
        </div>`,
    );
});

export default router;
