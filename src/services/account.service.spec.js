const jwt = require('jsonwebtoken');
const { AccountService } = require('./index');
const CustomError = require('../utils/error');
const { accounts: mockAccounts } = require('../fixtures');
const { TOKEN_AUDIENCE: { CUSTOMER } } = require('../constants');

jest.mock('../utils/generator', () => ({
  generateId: () => 'ztYtfy7C1j',
}));

describe('AccountService', () => {
  let accountService;
  let mockRepository;
  let mockLogger;
  let mockEncryption;
  let mockConfig;

  beforeEach(() => {
    mockRepository = {
      findAccountByEmail: jest.fn(),
      createAccount: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
    };
    mockEncryption = {
      encrypt: jest.fn(),
      compare: jest.fn(),
    };
    mockConfig = {
      encryption: { secret: 'secret' },
      jwt: { secretKey: 'secretKey', keyAlgorithm: 'HS256', expiry: '1d' },
    };
    accountService = new AccountService({
      repository: mockRepository,
      logger: mockLogger,
      encryption: mockEncryption,
      config: mockConfig,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#login', () => {
    it('should throw custom error account not found when account is not exist', async () => {
      mockRepository.findAccountByEmail.mockResolvedValue(null);

      await expect(accountService.login('email@email.com', '123'))
        .rejects.toThrow(new CustomError('Account not found', 404));
    });

    it('should throw custom error password did not match when password is incorrect', async () => {
      mockRepository.findAccountByEmail.mockResolvedValueOnce(mockAccounts[0]);
      mockEncryption.compare.mockReturnValueOnce(false);

      await expect(accountService.login('email@email.com', '123'))
        .rejects.toThrow(new CustomError('Password did not match', 401));
    });

    it('should return token when account found and password is correct', async () => {
      const mockUserId = '1';
      mockRepository.findAccountByEmail.mockResolvedValueOnce({
        ...mockAccounts[0],
        _id: mockUserId,
      });
      mockEncryption.compare.mockReturnValueOnce(true);
      const spyJwt = jest.spyOn(jwt, 'sign');
      const jwtPayload = {
        cif: mockAccounts[0].cif,
        email: mockAccounts[0].email,
      };
      const token = await accountService.login(mockAccounts[0].email, '123');

      expect(spyJwt).toBeCalledWith(jwtPayload, mockConfig.jwt.secretKey, {
        expiresIn: mockConfig.jwt.expiry,
        algorithm: mockConfig.jwt.keyAlgorithm,
        audience: CUSTOMER,
      });
      expect(token).not.toBeNull();
    });
  });

  describe('#register', () => {
    it('should invoke create with correct payload', async () => {
      const mockEncryptedPassword = '1ZcSS0lCmqqmzdbofawxp2rtBw';
      mockEncryption.encrypt.mockReturnValueOnce(mockEncryptedPassword);
      const mockAccountPayload = {
        ...mockAccounts[0],
        cif: 'ztYtfy7C1j',
        password: mockEncryptedPassword,
      };

      await accountService.register({ ...mockAccounts[0], password: '123' });

      expect(mockRepository.createAccount).toBeCalledWith(mockAccountPayload);
    });
  });
});
