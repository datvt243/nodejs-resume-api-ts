/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request } from 'express';

export * from './bcrypt.ts';
export * from './helper.ts';
export * from './jwt.ts';
export * from './valid.ts';

import { jwtVerify } from './jwt.ts';
import { TOKEN_SECRET } from '../config/process.config.ts';

export const _log = (props: null | '' | string | string[] | { text: string; type: 'warn' | 'error' | 'table' }) => {
    /* 
    console.warn(): In ra cảnh báo.
	console.error(): In ra lỗi.
	console.table(): In ra bảng dữ liệu.
	console.time() và console.timeEnd(): Đo thời gian thực hiện của một đoạn mã. 
    */

    if (!props) return;

    if (typeof props === 'string') return console.log(props);
    if (Array.isArray(props)) {
        console.group();
        props.forEach((el) => {
            console.log({ el });
        });
        console.groupEnd();
        return;
    }

    const obj = {
        warn: (t: string): void => console.warn(t),
        error: (t: string): void => console.error(t),
        table: (t: string): void => console.table(t),
    };
    const { text = '', type = 'warn' } = props;
    return Object.keys(obj).includes(type) ? obj?.[type]?.(text) : console.log(text);
};

export const getDataUserIdFromToken = (req: Request): { success: boolean; _id: string | null | '' } => {
    let success = false,
        _id = null;

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return { success: false, _id: '' };

    try {
        const { _id: id } = jwtVerify(token, TOKEN_SECRET);
        _id = id;
        success = true;
    } catch (err) {
        success = false;
    }

    return {
        success,
        _id,
    };
};
