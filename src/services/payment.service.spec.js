const mockDate = require('mockdate');
const PaymentService = require('./payment.service');
const CustomError = require('../utils/error');

describe('PaymentService', () => {
  const now = new Date();
  const mockPaymentRequest = {
    transactionID: 'generatedId',
    paymentCode: 'generatedId',
    expiredAt: now,
  };
  const mockPaymentPayload = {
    status: 'SETTLED',
    paymentCode: 'generatedId',
  };
  let paymentService;
  let mockRepository;
  let mockLogger;
  let mockTransactionService;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
    };
    mockTransactionService = {
      approveTransaction: jest.fn(),
    };
    paymentService = new PaymentService({
      repository: mockRepository,
      logger: mockLogger,
      transactionService: mockTransactionService,
    });
    mockDate.set(now);
  });

  afterEach(() => {
    mockDate.reset();
    jest.clearAllMocks();
  });

  describe('#processPayment', () => {
    it('should call approve transaction given transaction status is SETTLED', async () => {
      mockRepository.findOne.mockResolvedValue(mockPaymentRequest);

      await paymentService.processPayment(mockPaymentPayload);

      expect(mockTransactionService.approveTransaction)
        .toBeCalledWith(mockPaymentRequest.transactionID);
    });

    it('should call get payment data from payment repository', async () => {
      mockRepository.findOne.mockResolvedValue(mockPaymentRequest);

      await paymentService.processPayment(mockPaymentPayload);

      expect(mockRepository.findOne)
        .toBeCalledWith(mockPaymentRequest.paymentCode);
    });

    it('should throw CustomError when status is neither SETTLED or FAILED', async () => {
      const payload = {
        paymentCode: '',
        status: '',
      };

      await expect(paymentService.processPayment(payload))
        .rejects.toThrow(new CustomError('Invalid payment status', 400));
    });

    it('should throw CustomError when status is neither SETTLED or FAILED', async () => {
      mockRepository.findOne.mockResolvedValue();
      const payload = {
        paymentCode: '',
        status: 'SETTLED',
      };

      await expect(paymentService.processPayment(payload))
        .rejects.toThrow(new CustomError('Invalid Payment Code', 400));
    });
  });
});
