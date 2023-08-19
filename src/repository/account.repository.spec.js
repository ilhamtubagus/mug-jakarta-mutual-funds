const { MongoClient } = require('mongodb');
const { AccountRepository } = require('./index');
const { accounts: mockAccounts } = require('../fixtures');

describe('AccountRepository', () => {
  let connection;
  let collection;
  let accountRepository;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    collection = connection.db().collection('accounts');
    accountRepository = new AccountRepository({
      collection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('#findOneByEmail', () => {
    beforeAll((async () => {
      await collection.insertMany(mockAccounts);
    }));

    afterAll(async () => {
      await collection.drop();
    });

    it('should return user for given email', async () => {
      const expectedUser = mockAccounts[0];

      const account = await accountRepository.findOneByEmail(expectedUser.email);

      expect(account).toStrictEqual(expectedUser);
    });

    it('should return null when account for given email is not exist', async () => {
      const expectedUser = null;
      const account = await accountRepository.findOneByEmail('123');

      expect(account).toStrictEqual(expectedUser);
    });
  });

  describe('#create', () => {
    it('should return the newly created account', async () => {
      const expectedUser = mockAccounts[0];

      const { acknowledged } = await accountRepository.create(expectedUser);

      expect(acknowledged).toBe(true);
      expect(async () => collection.findOne({ email: expectedUser.email })).not.toBeNull();
    });
  });
});
