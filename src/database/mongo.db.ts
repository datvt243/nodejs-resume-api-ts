/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: MongoDB Connection Manager Class
 */

import mongoose, { Mongoose } from 'mongoose';

import { MONGO_URI, MONGOBD_USER, MONGOBD_PASSWORD } from '@/config/process.config';
import { _log } from '@/utils';

class MongoDBConnection {
  private static instance: MongoDBConnection | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
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
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<boolean> {
    try {
      const MONGO_URI = this.getMongoURI();
      await mongoose.connect(MONGO_URI);
      this.isConnected = true;
      _log('MongoDB Connected!');
      return true;
    } catch (e) {
      _log({ text: `MongoDB Connect failed !!! ${e}`, type: 'error' });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      _log('MongoDB Disconnected!');
    } catch (e) {
      _log({ text: `MongoDB Disconnect failed !!! ${e}`, type: 'error' });
    }
  }

  /**
   * Check if connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get mongoose instance
   */
  public getMongoose(): Mongoose {
    return mongoose;
  }
}

// Export singleton instance
const connectMongo = async (): Promise<boolean> => {
  const mongoConnection = MongoDBConnection.getInstance();
  return await mongoConnection.connect();
};

// Export class for better management
export { MongoDBConnection, connectMongo };
export default connectMongo;
