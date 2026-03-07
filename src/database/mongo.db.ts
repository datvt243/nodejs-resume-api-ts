/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';

import { MONGO_URI, MONGOBD_USER, MONGOBD_PASSWORD } from '@/config/process.config';
import { _log } from '@/utils';

/**
 * Fallback URI construction if MONGO_URI is not provided
 * Supports both full connection string or user/password only mode
 */
const getMongoURI = (): string => {
    // If full MONGO_URI is provided, use it
    if (MONGO_URI) {
        return MONGO_URI;
    }

    // Otherwise, construct from user/password (backward compatibility)
    if (MONGOBD_USER && MONGOBD_PASSWORD) {
        return `mongodb+srv://${MONGOBD_USER}:${MONGOBD_PASSWORD}@davidapi.jhhu4ml.mongodb.net/resume-api?retryWrites=true&w=majority&appName=davidAPI`;
    }

    // Throw error if no configuration
    throw new Error(
        'MongoDB configuration missing. Please set MONGO_URI or MONGOBD_USER/MONGOBD_PASSWORD in environment variables.',
    );
};

const connectMongo = async function (callback = () => {}): Promise<boolean> {
    try {
        const MONGO_URI = getMongoURI();
        await mongoose.connect(MONGO_URI);
        _log('MongoDB Connected!');
        return true;
    } catch (e) {
        _log({ text: `MongoDB Connect failed !!! ${e}`, type: 'error' });
        return false;
    }
};

export default connectMongo;
