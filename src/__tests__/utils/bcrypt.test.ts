import bcrypt from 'bcrypt';
import { bcryptGenerateSalt, bcryptCompareHash } from '@/utils/bcrypt';

jest.mock('bcrypt'); // 🛠 Mock bcrypt để test nhanh

describe('bcryptGenerateSalt', () => {
    const mockSalt = 'mocked_salt';
    const mockHash = 'mocked_hash';

    beforeEach(() => {
        jest.clearAllMocks(); // 🔄 Reset mock trước mỗi test
    });

    it('should generate a hashed password', async () => {
        (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

        const password = 'mypassword';
        const hashedPassword = await bcryptGenerateSalt(password);

        expect(hashedPassword).toBe(mockHash); // ✅ Kiểm tra giá trị trả về
        expect(bcrypt.genSalt).toHaveBeenCalledWith(expect.any(Number)); // ✅ Kiểm tra gọi genSalt
        expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt); // ✅ Kiểm tra gọi hash
    });

    it('should throw an error if hashing fails', async () => {
        (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('Salt error'));

        await expect(bcryptGenerateSalt('mypassword')).rejects.toThrow('Failed to hash password'); // ✅ Kiểm tra lỗi bị ném ra
    });
});

describe('bcryptCompareHash', () => {
  beforeEach(() => {
      jest.clearAllMocks(); // 🔄 Reset mock trước mỗi test
  });

  it('should return true when passwords match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await bcryptCompareHash('mypassword', 'hashed_password');

      expect(result).toBe(true); // ✅ Kiểm tra trả về true
      expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', 'hashed_password'); // ✅ Kiểm tra gọi bcrypt
  });

  it('should return false when passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await bcryptCompareHash('mypassword', 'wrong_hash');

      expect(result).toBe(false); // ✅ Kiểm tra trả về false
  });

  it('should return false if input is empty', async () => {
      expect(await bcryptCompareHash('', 'hashed_password')).toBe(false);
      expect(await bcryptCompareHash('mypassword', '')).toBe(false);
      expect(await bcryptCompareHash('', '')).toBe(false);
  });

  it('should return false if bcrypt.compare throws an error', async () => {
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('bcrypt error'));

      const result = await bcryptCompareHash('mypassword', 'hashed_password');

      expect(result).toBe(false); // ✅ Đảm bảo khi lỗi vẫn trả về false
  });
});