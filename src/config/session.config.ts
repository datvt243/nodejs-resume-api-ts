import { SESSION_SECRET } from '@/config/process.config';

export const sessionConfig = () => {
  return {
    secret: SESSION_SECRET || '',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  };
};
