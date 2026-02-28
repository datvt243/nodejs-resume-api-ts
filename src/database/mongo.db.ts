/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';

import { MONGOBD_USER, MONGOBD_PASSWORD } from '@/config/process.config';
import { _log } from '@/utils';

const connectMongo = async function (callback = () => {}): Promise<boolean> {
  try {
    if (!MONGOBD_USER || !MONGOBD_PASSWORD) {
      throw new Error('Missing MongoDB credentials. Check MONGOBD_USER and MONGOBD_PASSWORD in .env file');
    }

    const MONGO_URI = `mongodb+srv://${MONGOBD_USER}:${MONGOBD_PASSWORD}@davidapi.jhhu4ml.mongodb.net/resume-api?retryWrites=true&w=majority&appName=davidAPI`;
    await mongoose.connect(MONGO_URI);
    _log('MongoDB Connected!');
    return true;
  } catch (e) {
    _log({ text: `MongoDB Connect failed !!! ${e}`, type: 'error' });
    return false;
  }
};

export default connectMongo;
