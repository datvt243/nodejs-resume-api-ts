/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { logCatchError } from '@/utils';
import CandidateModel from '@/models/candidate.model';
import { bcryptGenerateSalt } from '@/utils';

import { checkEmailAlreadyExists } from './validEmailExist';

interface Auth {
  email: string;
  password: string;
  repassword?: string;
}

export const handlerRegister = async (item: Auth) => {
  /**
   * FLOW
   *  1. lấy thông tin input [email, pwd, re-pwd]
   *  2. validate thông tin
   *      2.1. 'false' -> return error
   *  3. mã hoá pwd
   *  4. lưu thông tin
   */

  let _success = false;
  let _message = '';

  try {
    const { email, password } = item;

    /**
     * check Email đã tồn tại chưa
     */
    const emailHasExits: boolean = await checkEmailAlreadyExists(email);
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

    _success = true;
    _message = 'Đăng ký thành công';
  } catch (e: any) {
    logCatchError(e);
    _message = e.message || '';
  } finally {
    return {
      success: _success,
      message: _message,
    };
  }
};
