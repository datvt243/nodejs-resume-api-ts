/**
 * JWT token utilities with secure secret key validation
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import jwt from 'jsonwebtoken';

export const jwtSign = ({
  data,
  secretKey,
  // Every real caller only ever passes `expiresIn` — confirmed via
  // grep, no other sign option is used anywhere in the codebase.
  props = { expiresIn: '1h' },
}: {
  data: Record<string, unknown>;
  secretKey: string | undefined;
  props?: { expiresIn: string };
}) => {
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
