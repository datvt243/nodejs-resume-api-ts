/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { _id: string };
      lang?: string;
      t?: (key: string) => string;
    }
  }
}

export {};
