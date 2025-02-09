/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { _log } from '.';
import bcrypt from 'bcrypt';

const saltRounds = 10; // số vòng mã hóa

export const bcryptGenerateSalt = async (pass: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(pass, salt);
        return hash;
    } catch (e) {
        _log('Error hashing password');
        throw new Error('Failed to hash password');
    }
};

export const bcryptCompareHash = async (str: string, hash: string): Promise<boolean> => {
    if (!str || !hash) return false;
    try {
        return Boolean(await bcrypt.compare(str, hash)); // make sure alway return boolean
    } catch (error) {
        _log('Error comparing hash:');
        return false;
    }
};
