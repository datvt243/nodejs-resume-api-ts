/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';

import { MONGOBD_USER, MONGOBD_PASSWORD } from '@/config/process.config';
import { _log } from '@/utils';

const connectMongo = function (callback = () => {}) {
    mongoose
        .connect(
            `mongodb+srv://${MONGOBD_USER}:${MONGOBD_PASSWORD}@davidapi.jhhu4ml.mongodb.net/resume-api?retryWrites=true&w=majority&appName=davidAPI`,
        )
        .then(() => {
            _log(`--------------------`);
            _log('MongoDB Connected!');
            callback?.();
        })
        .catch((err) => {
            _log({ text: `MongoDB Connect failed !!! ${err}`, type: 'error' });
        });
};

export default connectMongo;
