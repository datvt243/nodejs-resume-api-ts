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
const verifyToken_middleware_1 = require("@/middlewares/verifyToken.middleware");
const router = express_1.default.Router();
const auth_route_1 = __importDefault(require("./auth.route"));
const candidate_route_1 = __importDefault(require("./candidate.route"));
const education_route_1 = __importDefault(require("./education.route"));
const experience_route_1 = __importDefault(require("./experience.route"));
const reference_route_1 = __importDefault(require("./reference.route"));
const generalInformation_route_1 = __importDefault(require("./generalInformation.route"));
const project_route_1 = __importDefault(require("./project.route"));
const certificate_route_1 = __importDefault(require("./certificate.route"));
const award_route_1 = __importDefault(require("./award.route"));
const index_1 = require("@/candidate_me/index");
router.use('/auth', auth_route_1.default);
router.use('/candidate', verifyToken_middleware_1.verifyToken, candidate_route_1.default);
router.use('/education', verifyToken_middleware_1.verifyToken, education_route_1.default);
router.use('/award', verifyToken_middleware_1.verifyToken, award_route_1.default);
router.use('/experience', verifyToken_middleware_1.verifyToken, experience_route_1.default);
router.use('/reference', verifyToken_middleware_1.verifyToken, reference_route_1.default);
router.use('/general-information', verifyToken_middleware_1.verifyToken, generalInformation_route_1.default);
router.use('/project', verifyToken_middleware_1.verifyToken, project_route_1.default);
router.use('/certificate', verifyToken_middleware_1.verifyToken, certificate_route_1.default);
router.get('/download-pdf', verifyToken_middleware_1.verifyTokenByQuery, index_1.fnExportPDF);
router.get('/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Page not found',
        errors: null,
        data: null,
    });
});
exports.default = router;
