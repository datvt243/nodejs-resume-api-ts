/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import jwt from 'jsonwebtoken';

const getSecretKey = () => {
    return 'secretKey';
};

export const jwtSign = (
    data: Record<string, any>,
    secretKey: string | undefined,
    props: { expiresIn: string; [key: string]: any } = { expiresIn: '1h' },
) => {
    if (!secretKey) {
        return '';
    }
    const { expiresIn = '1d' } = props;
    const token = jwt.sign(data, secretKey, { expiresIn });
    return token;
};

export const jwtVerify = (token: string, secretKey: string | undefined) => {
    if (!secretKey) return { _id: '' };
    const decoded = jwt.verify(token, secretKey) as { _id: string };
    return decoded;
};
