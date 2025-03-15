import Joi from 'joi';
import { validateSchema, formatValidateError } from '@/utils/valid';

// Mock formatValidateError để tránh lỗi khi không có implement thật
jest.mock('@/utils', () => ({
    formatValidateError: jest.fn((error) => error.details.map((e: any) => e.message)),
}));

describe('validateSchema', () => {
    const schema = Joi.object({
        email: Joi.string().min(3).required(),
        password: Joi.string().min(6).required(),
    });

    test('✅ Dữ liệu hợp lệ - Trả về isValidated = true', () => {
        const validData = { email: 'testuser', password: '123456' };
        const result = validateSchema({ schema, item: validData });

        expect(result.isValidated).toBe(true);
        expect(result.value).toEqual(validData);
        expect(result.message).toBe('');
    });

    test('❌ Dữ liệu không hợp lệ - Trả về lỗi', () => {
        const invalidData = { email: 'ab', password: '123' };
        const result = validateSchema({ schema, item: invalidData });

        expect(result.isValidated).toBe(false);
        expect(result.message).toBe('Validation has errors');
        expect(result.errors).toBeDefined();
        //expect(formatValidateError).toHaveBeenCalled();
    });

    test('❌ Thiếu schema - Trả về lỗi "Invalid schema"', () => {
        const result = validateSchema({ schema: null as any, item: { email: 'test' } });

        expect(result.isValidated).toBe(false);
        expect(result.message).toBe('Invalid schema');
    });

    test('✅ Truyền `item = {}` nhưng schema không yêu cầu field - Vẫn hợp lệ', () => {
        const emptySchema = Joi.object({});
        const result = validateSchema({ schema: emptySchema, item: {} });

        expect(result.isValidated).toBe(true);
        expect(result.value).toEqual({});
    });
});