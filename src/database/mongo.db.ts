/**
 * MongoDB Connection Manager Class
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import mongoose, { Mongoose } from 'mongoose';

import { MONGO_URI, MONGOBD_USER, MONGOBD_PASSWORD, MONGO_MAX_POOL_SIZE, MONGO_MIN_POOL_SIZE } from '@/config/process.config';
import { _log } from '@/utils';

class MongoDBConnection {
  private static instance: MongoDBConnection | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * Build MongoDB URI from environment variables
   * Supports both full connection string or individual credentials
   */
  private getMongoURI(): string {
    if (MONGO_URI) {
      return MONGO_URI;
    }

    // Otherwise, construct from user/password (backward compatibility)
    if (MONGOBD_USER && MONGOBD_PASSWORD) {
      return `mongodb+srv://${MONGOBD_USER}:${MONGOBD_PASSWORD}@davidapi.jhhu4ml.mongodb.net/resume-api?retryWrites=true&w=majority&appName=davidAPI`;
    }

    throw new Error(
      'MongoDB configuration missing. Please set MONGO_URI or MONGOBD_USER/MONGOBD_PASSWORD in environment variables.',
    );
  }

  public async connect(): Promise<boolean> {
    try {
      const MONGO_URI = this.getMongoURI();
      await mongoose.connect(MONGO_URI, {
        maxPoolSize: Number(MONGO_MAX_POOL_SIZE) || 10,
        minPoolSize: Number(MONGO_MIN_POOL_SIZE) || 2,
      });
      this.isConnected = true;
      _log('[MongoDB] Connected!');
      return true;
    } catch (e) {
      _log({ text: `[MongoDB] Connect failed !!! ${e}`, type: 'error' });
      this.isConnected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      _log('[MongoDB] Disconnected!');
    } catch (e) {
      _log({ text: `[MongoDB] Disconnect failed !!! ${e}`, type: 'error' });
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getMongoose(): Mongoose {
    return mongoose;
  }
}

const connectMongo = async (): Promise<boolean> => {
  const mongoConnection = MongoDBConnection.getInstance();
  return await mongoConnection.connect();
};

export { MongoDBConnection, connectMongo };
export default connectMongo;
