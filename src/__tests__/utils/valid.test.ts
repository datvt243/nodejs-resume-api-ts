import Joi from 'joi';
import { passwordRegex } from '@/config/regex.config';
import { PASSWORD_MIN_LENGTH } from '@/config/joi.config';
import { validateSchema, formatValidateError } from '@/utils/valid';

// Mock formatValidateError để tránh lỗi khi không có implement thật
jest.mock('@/utils', () => ({
  formatValidateError: jest.fn((error) => error.details.map((e: any) => e.message)),
}));

describe('validateSchema', () => {
  const schema = Joi.object({
    email: Joi.string().min(3).required(),
    password: Joi.string().min(6).pattern(/[a-z]/).required(),
  });

  test('✅ Dữ liệu hợp lệ - Trả về isValidated = true', () => {
    const validData = { email: 'testuser@example.com', password: 'test123' };
    const result = validateSchema({ schema, item: validData });

    expect(result.isValidated).toBe(true);
    expect(result.value).toEqual(validData);
    expect(result.message).toBe('');
  });

  test('❌ Dữ liệu không hợp lệ - Trả về lỗi', () => {
    const invalidData = { email: 'ab', password: '123' };
    const result = validateSchema({ schema, item: invalidData });

    expect(result.isValidated).toBe(false);
    expect(result.message).toBe('Dữ liệu không hợp lệ');
    expect(result.errors).toBeDefined();
  });

  test('❌ Thiếu schema - Trả về lỗi "Schema không hợp lệ"', () => {
    const result = validateSchema({ schema: null as any, item: { email: 'test' } });

    expect(result.isValidated).toBe(false);
    expect(result.message).toBe('Schema không hợp lệ');
  });

  test('✅ Truyền `item = {}` nhưng schema không yêu cầu field - Vẫn hợp lệ', () => {
    const emptySchema = Joi.object({});
    const result = validateSchema({ schema: emptySchema, item: {} });

    expect(result.isValidated).toBe(true);
    expect(result.value).toEqual({});
  });
});
