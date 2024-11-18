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
require('./alias');
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
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
    app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
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
const mongo_db_1 = __importDefault(require("@/database/mongo.db"));
(0, mongo_db_1.default)(() => {
    runServer?.();
});
