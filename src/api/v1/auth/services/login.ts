/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import CandidateModel from '@/models/candidate.model';
import { bcryptCompareHash, jwtSign } from '@/utils';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';

interface Auth {
  email: string;
  password: string;
  repassword?: string;
}

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
  const token = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
  const tokenRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });

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
