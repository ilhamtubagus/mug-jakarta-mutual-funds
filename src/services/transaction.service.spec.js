const moment = require('moment');
const mockDate = require('mockdate');
const { TransactionService } = require('./index');
const { products, navs } = require('../fixtures');
const CustomError = require('../utils/error');

jest.mock('../utils/generator', () => ({
  generateId: () => 'generatedId',
}));

describe('TransactionService', () => {
  const user = { cif: 'QWERTY' };
  const now = new Date();
  const tomorrow = new Date(moment(now).add(1, 'd').toDate());
  const mockProduct = {
    ...products[0],
    nav: { ...navs[0] },
  };
  const mockPaymentRequest = {
    transactionID: 'generatedId',
    paymentCode: 'generatedId',
    expiredAt: tomorrow,
  };
  let opts;
  let transactionService;

  const startSession = {
    endSession: jest.fn(),
    withTransaction: jest.fn().mockImplementation((fn) => fn()),
  };

  beforeEach(() => {
    opts = {
      repository: {
        create: jest.fn(),
        findOne: jest.fn(),
        updateStatus: jest.fn(),
      },
      logger: {
        info: jest.fn(),
      },
      paymentRepository: {
        create: jest.fn(),
      },
      productService: {
        findOneByProductCode: jest.fn(),
      },
      portfolioService: {
        updateOwnedProduct: jest.fn(),
        findOne: jest.fn(),
      },
      config: {
        paymentExpiration: 1,
      },
      mongoClient: {
        startSession: jest.fn().mockImplementation(() => startSession),
      },
    };

    transactionService = new TransactionService(opts);
    mockDate.set(now);
  });

  afterEach(() => {
    mockDate.reset();
    jest.clearAllMocks();
  });

  describe('#create', () => {
    it('should return payment request data', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
      opts.repository.create.mockResolvedValue({});
      opts.paymentRepository.create.mockResolvedValue(mockPaymentRequest);
      opts.portfolioService.findOne.mockResolvedValue({});
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };
      const expectedResult = {
        ...mockPaymentRequest,
        ...payload,
        status: 'PENDING',
      };

      const result = await transactionService.create(user, payload);

      expect(result).toStrictEqual(expectedResult);
    });

    it('should throw invalid transaction type for type other than BUY or SELL', async () => {
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'RED',
        portfolioCode: '001',
      };

      await expect(transactionService.create(user, payload))
        .rejects.toThrow(new CustomError('Invalid transaction type', 400));
    });

    it('should call create transaction with constructed transaction data', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
      opts.repository.create.mockResolvedValue();
      opts.portfolioService.findOne.mockResolvedValue({ portfolioCode: '001' });
      opts.paymentRepository.create.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };
      const expected = {
        transactionID: 'generatedId',
        cif: user.cif,
        amount: 20000,
        product: {
          ...mockProduct,
          nav: mockProduct.nav.currentValue,
        },
        type: 'BUY',
        status: 'PENDING',
        portfolioCode: '001',
      };

      await transactionService.create(user, payload);

      expect(opts.repository.create).toBeCalledWith(expected, startSession);
    });

    it('should call request payment with generated transaction id', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
      opts.repository.create.mockResolvedValue();
      opts.portfolioService.findOne.mockResolvedValue({ portfolioCode: '001' });
      opts.paymentRepository.create.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };

      await transactionService.create(user, payload);

      expect(opts.paymentRepository.create).toBeCalledWith(mockPaymentRequest, startSession);
    });

    it('should throw error when portfolio is not found', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
      opts.repository.create.mockResolvedValue();
      opts.portfolioService.findOne.mockReturnValue(null);
      opts.paymentRepository.create.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };

      await expect(transactionService.create(user, payload))
        .rejects.toThrow(new CustomError('Portfolio with code 001 not found', 400));
    });

    it('should throw error when product is not found', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(null);
      opts.repository.create.mockResolvedValue();
      opts.portfolioService.findOne.mockReturnValue({ portfolioCode: '001' });
      opts.paymentRepository.create.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };

      await expect(transactionService.create(user, payload))
        .rejects.toThrow(new CustomError('Product with code SCHE not found', 400));
    });
  });

  describe('#processPayment', () => {
    it('should process SETTLED payment for buy transaction', () => {

    });
  });
});
