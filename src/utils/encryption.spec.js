const { encrypt, compare } = require('./encryption');

describe('encryption', () => {
  const plain = 'password';
  const secret = 'secret';
  describe('#encrypt', () => {
    it('should return the encrypted text', () => {
      const result = encrypt(plain, secret);

      expect(result).not.toBe(plain);
    });
  });

  describe('#compare', () => {
    it('should return true when encrypted text after decrypted is equal with plain', () => {
      const cipher = encrypt(plain, secret);
      const result = compare(cipher, plain, secret);

      expect(result).toBe(true);
    });

    it('should return false when encrypted text after decrypted is not equal with plain', () => {
      const cipher = encrypt(plain, secret);
      const textToCompare = '123';
      const result = compare(cipher, textToCompare, secret);

      expect(result).toBe(false);
    });
  });
});
