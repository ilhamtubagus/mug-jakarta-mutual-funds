const { MongoClient } = require('mongodb');
const moment = require('moment');
const PaymentRepository = require('./payment.repository');

describe('PortfolioRepository', () => {
  let connection;
  let paymentCollection;
  let paymentRepository;
  const paymentRequest = {
    transactionID: '123123ASASSA',
    paymentCode: '123123ASASSAA',
    expiredAt: moment().add(10, 'seconds').toDate(),
  };

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    paymentCollection = await connection.db().collection('paymentRequests');
    paymentRepository = new PaymentRepository({
      collection: paymentCollection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  afterEach(async () => {
    await paymentCollection.drop();
  });

  describe('#create', () => {
    it('should return the acknowledged and success inserting the document', async () => {
      const paymentRequestData = {
        transactionID: '123123ASASSA',
        paymentCode: '123123ASASSAA',
        expiredAt: new Date(),
      };
      const { acknowledged } = await paymentRepository.create(paymentRequestData);

      expect(acknowledged).toBe(true);
    });

    it('should return the acknowledged and success inserting the document when session is supplied', async () => {
      const paymentRequestData = {
        transactionID: '123123ASASSA',
        paymentCode: '123123ASASSAA',
        expiredAt: new Date(),
      };
      const session = await connection.startSession();

      const { acknowledged } = await paymentRepository.create(paymentRequestData, session);

      expect(acknowledged).toBe(true);
    });
  });

  describe('#findOne', () => {
    it('should return found payment data', async () => {
      await paymentCollection.insertOne(paymentRequest);

      const result = await paymentRepository.findOne(paymentRequest.paymentCode);

      expect(result).toStrictEqual(paymentRequest);
    });
  });
});
