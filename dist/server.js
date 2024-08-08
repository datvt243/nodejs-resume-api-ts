"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Learning nodejs basic
 */
require('module-alias/register');
const dotenv_1 = __importDefault(require("dotenv"));
/* import path, { dirname } from 'path'; */
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
/* import exitHook from 'exit-hook'; */
const middlewares_1 = require("@/middlewares");
const config_1 = require("@/config");
const routers_1 = __importDefault(require("@/routers"));
dotenv_1.default.config();
const runServer = () => {
    const app = (0, express_1.default)();
    /* const __dirname = dirname(new URL(import.meta.url).pathname); */
    /**
     * use Session
     */
    app.use((0, express_session_1.default)((0, config_1.sessionConfig)()));
    /**
     * use CORS
     */
    app.use((0, cors_1.default)((0, config_1.corsConfig)()));
    /**
     * use Body-parser
     */
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.use(body_parser_1.default.json());
    /**
     * use static-files
     */
    /* app.use(express.static(path.join(__dirname, './public'))); */
    /**
     * use router
     */
    app.use(routers_1.default);
    /**
     * use middleware
     */
    app.use(middlewares_1.errorsMiddleware);
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
const mongo_db_1 = __importDefault(require("@/database/mongo.db"));
(0, mongo_db_1.default)(() => {
    runServer?.();
});
