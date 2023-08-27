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
      const { acknowledged } = await transactionRepository.createTransaction(transactionData);

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

  describe('#updateStatus', () => {
    it('should update transaction data given transactionID and status', async () => {
      const insertedData = await transactionRepository.collection.findOne({ transactionID: 'GT1LXXJW9UHZL1P' });
      console.log({ insertedData });
      const { transactionID } = mockTransactions[0];
      const expectedResult = {
        ...mockTransactions[0],
        status: 'SETTLED',
      };

      const result = await transactionRepository.updateStatus(transactionID, 'SETTLED');
      console.log(result);

      expect(result.value).toStrictEqual(expectedResult);
    });
  });
});
