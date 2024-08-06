// comming soon

/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { TOKEN_SECRET, TOKEN_REFRESH } from '@/config/process.config';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Access denied. No token provided.',
            invalidToken: true,
        });
    }

    verify(token, req, res, next);
};

export const verifyTokenByQuery = (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;

    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Access denied. No token provided.',
            invalidToken: true,
        });
    }

    verify(token, req, res, next);
};

function verify(token: any, req: Request, res: Response, next: NextFunction) {
    try {
        const decoded = TOKEN_SECRET ? jwt.verify(token, TOKEN_SECRET) : { _id: null };
        const { _id } = decoded as { _id: string | null };

        /**
         * thêm candidateId vào body
         */
        req.body.candidateId = _id;

        /** next */
        next();
        /**  */
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid token.', invalidToken: true });
    }
}
