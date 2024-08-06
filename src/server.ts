/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Learning nodejs basic
 */

import dotenv from 'dotenv';

/* import path, { dirname } from 'path'; */
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
    /* app.use(express.static(path.join(__dirname, './public'))); */

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
    /* app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views')); */

    /**
     * listen app
     */
    app.listen(LOCAL_PORT, () => {
        const str = NODE_ENV === 'development' ? `http://localhost:${LOCAL_PORT}` : LOCAL_PORT;
        console.log(`App listening on port: ${str}`);
    });

    /* exitHook(() => {
        // TODO: close connect mongo (coming soon...)
    }); */
};

/**
 * connect to mongoDB
 */
const { LOCAL_PORT = 3001, NODE_ENV = 'development' } = process.env;
import connectMongo from '@/database/mongo.db';

connectMongo(() => {
    runServer?.();
});
