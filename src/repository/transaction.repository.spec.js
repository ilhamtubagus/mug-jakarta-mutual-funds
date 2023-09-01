const { MongoClient } = require('mongodb');
const TransactionRepository = require('./transaction.repository');
const { transactions } = require('../fixtures');

describe('TransactionRepository', () => {
  let connection;
  let transactionCollection;
  let transactionRepository;
  let mockTransactions;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    transactionCollection = await connection.db().collection('transactions');
    transactionRepository = new TransactionRepository({
      collection: transactionCollection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    mockTransactions = [...transactions];

    await transactionCollection.insertMany(mockTransactions);
  });

  afterEach(async () => {
    await transactionCollection.drop();
  });

  describe('#createTransaction', () => {
    it('should return the acknowledged and success inserting the document', async () => {
      const transactionData = {
        transactionID: '',
        cif: '',
        amount: '',
        units: '',
        product: '',
        type: '',
        status: '',
        portfolioCode: '',
      };
      const { acknowledged } = await transactionRepository.create(transactionData);

      expect(acknowledged).toBe(true);
    });

    it('should return the acknowledged and success inserting the document when session is supplied', async () => {
      const transactionData = {
        transactionID: '',
        cif: '',
        amount: '',
        units: '',
        product: '',
        type: '',
        status: '',
        portfolioCode: '',
      };
      const session = await connection.startSession();

      const { acknowledged } = await transactionRepository.create(transactionData, session);

      expect(acknowledged).toBe(true);
    });
  });

  describe('#findOne', () => {
    it('should return the found transaction', async () => {
      const { transactionID } = mockTransactions[0];

      const result = await transactionRepository.findOne(transactionID);

      expect(result).toStrictEqual(mockTransactions[0]);
    });
  });

  describe('#update', () => {
    it('should update transaction data given transactionID and status', async () => {
      const transaction = await transactionRepository.collection.findOne({ transactionID: 'GT1LXXJW9UHZL1P' });
      const { transactionID } = transaction;
      const expectedResult = {
        ...transaction,
        status: 'SETTLED',
      };

      delete expectedResult.modifiedAt;

      const result = await transactionRepository.update(transactionID, { status: 'SETTLED' });

      expect(expectedResult.modifiedAt).not.toBe(result.value.modifiedAt);
      delete result.value.modifiedAt;
      expect(result.value).toStrictEqual(expectedResult);
    });
  });

  describe('#findWithFilter', () => {
    it('should return the found transaction with given filter', async () => {
      const cif = 'HRSTBDHICE';
      const payload = { page: 1 };

      const result = await transactionRepository.findWithFilter(cif, payload);

      expect(result).toStrictEqual(mockTransactions);
    });

    it('should return the found transaction with transactionType filter', async () => {
      const cif = 'HRSTBDHICE';
      const payload = {
        transactionType: 'BUY',
        page: 1,
      };

      const result = await transactionRepository.findWithFilter(cif, payload);

      expect(result).toStrictEqual([mockTransactions[0]]);
    });

    it('should return the found transaction with productCode filter', async () => {
      const cif = 'HRSTBDHICE';
      const payload = {
        productCode: 'SCHE',
        page: 1,
      };

      const result = await transactionRepository.findWithFilter(cif, payload);

      expect(result).toStrictEqual([mockTransactions[0]]);
    });

    it('should return the found transaction sorted by amount ordered ascending', async () => {
      const cif = 'HRSTBDHICE';
      const payload = {
        sortBy: 'amount',
        order: 'asc',
        page: 1,
      };

      const result = await transactionRepository.findWithFilter(cif, payload);

      expect(result).toStrictEqual(mockTransactions);
    });

    it('should return the found transaction sorted by amount ordered descending', async () => {
      const cif = 'HRSTBDHICE';
      const payload = {
        sortBy: 'amount',
        order: 'desc',
        page: 1,
      };

      const result = await transactionRepository.findWithFilter(cif, payload);

      expect(result).toStrictEqual([mockTransactions[1], mockTransactions[0]]);
    });
  });
});
