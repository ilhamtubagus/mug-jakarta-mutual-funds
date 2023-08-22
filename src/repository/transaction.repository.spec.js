const { MongoClient } = require('mongodb');
const TransactionRepository = require('./transaction.repository');

describe('PortfolioRepository', () => {
  let connection;
  let transactionCollection;
  let transactionRepository;

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
});
