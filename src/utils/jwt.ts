/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: JWT token utilities with secure secret key validation
 */

import jwt from 'jsonwebtoken';

export const jwtSign = (
  data: Record<string, unknown>,
  secretKey: string | undefined,
  // Every real caller only ever passes `expiresIn` — confirmed via
  // grep, no other sign option is used anywhere in the codebase.
  props: { expiresIn: string } = { expiresIn: '1h' },
) => {
  if (!secretKey) {
    throw new Error('JWT secret key is missing. Check TOKEN_SECRET in .env file');
  }

  const { expiresIn = '1d' } = props;
  const token = jwt.sign(data, secretKey, { expiresIn });
  return token;
};

export const jwtVerify = (token: string, secretKey: string | undefined) => {
  if (!secretKey) {
    throw new Error('JWT secret key is missing. Check TOKEN_SECRET in .env file');
  }
  const decoded = jwt.verify(token, secretKey) as { _id: string };
  return decoded;
};
