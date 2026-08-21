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
