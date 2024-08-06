/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import CandidateModel from '@/models/candidate.model';
import { bcryptGenerateSalt, bcryptCompareHash, jwtSign } from '@/utils';
import { TOKEN_SECRET, TOKEN_REFRESH } from '@/config/process.config';

interface Auth {
    email: string;
    password: string;
    repassword?: string;
}

export const isEmailAlreadyExists = async (email: string) => {
    const find = await CandidateModel.findOne({ email });
    return !!find;
};

export const handlerRegister = async (item: Auth) => {
    /**
     * FLOW
     *  1. lấy thông tin input [email, pwd, re-pwd]
     *  2. validate thông tin
     *      2.1. 'false' -> return error
     *  3. mã hoá pwd
     *  4. lưu thông tin
     */
    const { email, password } = item;

    /**
     * check Email đã tồn tại chưa
     */
    const emailHasExits = await isEmailAlreadyExists(email);
    if (emailHasExits) return { success: false, message: 'Email đã tồn tại' };

    /**
     * TODO: validate data với mongo model.valid
     */

    const bcryptPwd = bcryptGenerateSalt(password);
    const document = await CandidateModel.create({
        _id: null,
        email: email,
        password: bcryptPwd,
    });
    return { success: true, message: 'Đăng ký thành công' };
};

export const handlerLogin = async (data: Auth) => {
    /**
     * FLOW
     * 1. find user by email
     * 2. check
     *      2.1. ko tìm thấy return error
     *      2.2. tìm thấy -> lấy ra pwd (đã đc hash)
     * 3. compare pwd (input) và pwd (hash)
     *      3.1. 'false' -> return error
     *      3.2. 'true' -> return [token, user]
     */

    const { email, password } = data;

    const _user = await CandidateModel.findOne({ email });
    if (!_user) return { success: false, message: 'Email không tồn tại' };

    /**
     * so sánh Pwd với pwd trong database
     */
    const { _id, password: pwdHash } = _user;
    const comparePwd = await bcryptCompareHash(password, pwdHash);
    if (!comparePwd) return { success: false, message: 'Mật khẩu không chính xác' };

    /**
     * init token
     */
    const token = jwtSign({ _id }, TOKEN_SECRET);
    const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH);

    return {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
            user: {
                email: _user.email,
                first_name: _user.firstName || '',
                last_name: _user.lastName || '',
            },
            token: token,
            tokenRefresh: tokenRefresh,
        },
        errors: null,
    };
};
