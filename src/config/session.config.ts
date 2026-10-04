/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { SESSION_SECRET } from '@/config/process.config';

export const sessionConfig = () => {
  return {
    secret: SESSION_SECRET || '',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  };
};
