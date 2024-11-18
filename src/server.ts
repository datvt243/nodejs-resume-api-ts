/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Learning nodejs basic
 */
require('module-alias/register');
require('./alias');
import dotenv from 'dotenv';

 import path, { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
/* import exitHook from 'exit-hook'; */

import { errorsMiddleware } from '@/middlewares';
import { sessionConfig, corsConfig } from '@/config';

import router from '@/routers';

dotenv.config();

const runServer = () => {
    const app = express();

    /* const __dirname = dirname(new URL(import.meta.url).pathname); */

    /**
     * use Session
     */
    app.use(session(sessionConfig()));

    /**
     * use CORS
     */
    app.use(cors(corsConfig()));

    /**
     * use Body-parser
     */
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    /**
     * use static-files
     */
     app.use(express.static(path.join(__dirname, 'public')));

    /**
     * use router
     */
    app.use(router);

    /**
     * use middleware
     */
    app.use(errorsMiddleware);

    /**
     * use template-engine
     */
    app.set('view engine', 'pug');
    app.set('views', './views'); /* app.set('views', './views'); */

    /**
     * listen app
     */
    const _env = process.env.NODE_ENV || 'development';
    const _port = _env !== 'production' ? LOCAL_PORT : 3008;
    app.listen(_port, () => {
        const str = _port === 'development' ? `http://localhost:${_port}` : _port;
        console.log(`App listening on port: ${str} - ${_env}`);
    });

    /* exitHook(() => {
        // TODO: close connect mongo (coming soon...)
    }); */
};

/**
 * connect to mongoDB
 */
const { LOCAL_PORT = 3001 } = process.env;
import connectMongo from '@/database/mongo.db';

connectMongo(() => {
    runServer?.();
});
