const { MongoClient } = require('mongodb');
const PaymentRepository = require('./payment.repository');

describe('PortfolioRepository', () => {
  let connection;
  let paymentCollection;
  let paymentRepository;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    paymentCollection = await connection.db().collection('payment');
    paymentRepository = new PaymentRepository({
      collection: paymentCollection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('#create', () => {
    it('should return the acknowledged and success inserting the document', async () => {
      const paymentRequestData = {
        transactionID: '',
        paymentCode: '',
        expiredAt: new Date(),
      };
      const { acknowledged } = await paymentRepository.createPaymentRequest(paymentRequestData);

      expect(acknowledged).toBe(true);
    });
  });

  // describe('#findOne', () => {
  //   it('should return found payment data', async () => {
  //     const paymentRequestData = {
  //       transactionID: '',
  //       paymentCode: '',
  //       expiredAt: new Date(),
  //     };
  //     const result = await paymentRepository.findOne(paymentRequestData);

  //     expect(acknowledged).toBe(true);
  //   });
  // });
});
