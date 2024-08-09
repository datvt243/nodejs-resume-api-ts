"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const candidate_me_1 = require("@/candidate_me");
const index_1 = __importDefault(require("./api/v1/index"));
/**
 * API V1
 */
router.use('/api/v1', index_1.default);
/**
 * get ME
 */
router.get('/api/me/:email', candidate_me_1.fnGetAboutMe);
/**
 * 404
 */
router.get('/api/*', (req, res) => {
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
router.get('/*', (req, res) => {
    res.send(`<div style="text-align: center; padding: 50px">
            <h1 style="font-size: 8vw; text-transform: uppercase; letter-spacing: .1em;">Hello World!</h1> 
            <br/>
            <p>Go to <a href="https://datvt243.github.io/vue-resume-web/">Resume Web Page</a></p>
        </div>`);
});
exports.default = router;
