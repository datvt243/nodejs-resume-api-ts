import mongoose from 'mongoose';
import connectMongo from '@/database/mongo.db';
import { _log } from '@/utils';

jest.mock('mongoose', () => ({
    connect: jest.fn(),
}));

jest.mock('@/utils', () => ({
    _log: jest.fn(),
}));

describe('connectMongo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true and log "MongoDB Connected!" when successful', async () => {
        (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

        const result = await connectMongo();

        expect(result).toBe(true);
        expect(mongoose.connect).toHaveBeenCalled();
        expect(_log).toHaveBeenCalledWith('MongoDB Connected!');
    });

    it('should return false and log error when connection fails', async () => {
        const errorMessage = new Error('Connection failed');
        (mongoose.connect as jest.Mock).mockRejectedValueOnce(errorMessage);

        const result = await connectMongo();

        expect(result).toBe(false);
        expect(_log).toHaveBeenCalledWith({
            text: `MongoDB Connect failed !!! ${errorMessage}`,
            type: 'error',
        });
    });
});