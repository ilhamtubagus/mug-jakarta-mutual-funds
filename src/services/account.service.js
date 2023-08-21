const jwt = require('jsonwebtoken');
const CustomError = require('../utils/error');
const { TOKEN_AUDIENCE: { CUSTOMER } } = require('../constants');
const { generateId } = require('../utils/generator');

class AccountService {
  constructor({
    repository, logger, encryption, config,
  }) {
    this.repository = repository;
    this.logger = logger;
    this.encryption = encryption;
    this.config = config;
  }

  _generateToken(payload) {
    const { jwt: { secretKey, keyAlgorithm, expiry } } = this.config;
    return jwt.sign(
      payload,
      secretKey,
      { expiresIn: expiry, algorithm: keyAlgorithm, audience: CUSTOMER },
    );
  }

  async login({ email, password }) {
    this.logger.info(this.constructor.name, `Login with email ${email}`);
    const account = await this.repository.findOneByEmail(email);
    this.logger.info(account);
    if (!account) {
      throw new CustomError('Account not found', 404);
    }

    const { password: cipherPassword } = account;
    const { encryption: { secret } } = this.config;
    const match = this.encryption.compare(cipherPassword, password, secret);

    if (!match) {
      throw new CustomError('Password did not match', 401);
    }

    const jwtPayload = {
      cif: account.cif,
      email: account.email,
    };

    return this._generateToken(jwtPayload);
  }

  async register(payload) {
    this.logger.info(this.constructor.name, 'Register account', payload);

    const { encryption: { secret } } = this.config;
    const encryptedPassword = this.encryption.encrypt(payload.password, secret);
    const account = {
      ...payload,
      cif: generateId(),
      password: encryptedPassword,
    };

    return this.repository.create(account);
  }
}

module.exports = AccountService;
