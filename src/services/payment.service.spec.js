const mockDate = require('mockdate');
const moment = require('moment');
const PaymentService = require('./payment.service');
const CustomError = require('../utils/error');

jest.mock('../utils/generator', () => ({
  generateId: () => 'ztYtfy7C1j',
}));

describe('PaymentService', () => {
  const now = new Date();
  let paymentService;
  let mockRepository;
  let mockLogger;

  beforeEach(() => {
    mockRepository = {
      createPaymentRequest: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
    };
    paymentService = new PaymentService({
      repository: mockRepository,
      logger: mockLogger,
    });
    mockDate.set(now);
  });

  afterEach(() => {
    mockDate.reset();
    jest.clearAllMocks();
  });

  describe('#requestPayment', () => {
    it('should add new payment request document into repository', async () => {
      mockRepository.createPaymentRequest.mockResolvedValue({ acknowledged: true });
      const transactionID = 'qwertyuiop';
      const expectedDocuments = {
        transactionID,
        paymentCode: 'ztYtfy7C1j',
        expiredAt: moment(now).add(1, 'd').toDate(),
      };

      await paymentService.requestPayment(transactionID);

      expect(mockRepository.createPaymentRequest).toBeCalledWith(expectedDocuments);
    });

    it('should return inserted payment request document', async () => {
      mockRepository.createPaymentRequest.mockResolvedValue({ acknowledged: true });
      const transactionID = 'qwertyuiop';
      const expectedDocuments = {
        transactionID,
        paymentCode: 'ztYtfy7C1j',
        expiredAt: moment(now).add(1, 'd').toDate(),
      };

      const result = await paymentService.requestPayment(transactionID);

      expect(result).toStrictEqual(expectedDocuments);
    });

    it('should throw error when failed inserting new document', async () => {
      const transactionID = 'qwertyuiop';

      await expect(paymentService.requestPayment(transactionID))
        .rejects.toThrow(new CustomError('Failed to create payment request'));
    });
  });
});
