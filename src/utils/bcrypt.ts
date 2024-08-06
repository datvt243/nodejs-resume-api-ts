/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import bcrypt from 'bcrypt';

const saltRounds = 10;

export const bcryptGenerateSalt = (pass: string) => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(pass, salt);
    return hash || pass;
};

export const bcryptCompareHash = async (str: string, hash: string): Promise<boolean> => {
    if (!str || !hash) return false;
    const match = await bcrypt.compare(str, hash);
    return match;
};
