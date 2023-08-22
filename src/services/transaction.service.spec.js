const mockDate = require('mockdate');
const { TransactionService } = require('./index');
const { products, navs } = require('../fixtures');
const CustomError = require('../utils/error');

jest.mock('../utils/generator', () => ({
  generateId: () => 'generatedTransactionId',
}));

describe('TransactionService', () => {
  const user = { cif: 'QWERTY' };
  const now = new Date();
  const mockProduct = {
    ...products[0],
    nav: { ...navs[0] },
  };
  const mockPaymentRequest = {
    transactionID: 'generatedTransactionId',
    paymentCode: 'generatedPaymentCode',
    expiredAt: now,
  };
  let opts;
  let transactionService;

  beforeEach(() => {
    opts = {
      repository: {
        createTransaction: jest.fn(),
      },
      logger: {
        info: jest.fn(),
      },
      paymentService: {
        requestPayment: jest.fn(),
      },
      productService: {
        findOneByProductCode: jest.fn(),
      },
    };

    transactionService = new TransactionService(opts);
  });

  afterEach(() => {
    mockDate.reset();
    jest.clearAllMocks();
  });

  describe('#create', () => {
    it('should return payment request data', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
      opts.repository.createTransaction.mockResolvedValue();
      opts.paymentService.requestPayment.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };

      const result = await transactionService.create(user, payload);

      expect(result).toStrictEqual(mockPaymentRequest);
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
      opts.repository.createTransaction.mockResolvedValue();
      opts.paymentService.requestPayment.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };
      const expected = {
        transactionID: 'generatedTransactionId',
        cif: user.cif,
        amount: 20000,
        units: '10.0000',
        product: {
          ...mockProduct,
          nav: mockProduct.nav.currentValue,
        },
        type: 'BUY',
        status: 'PENDING',
        portfolioCode: '001',
      };

      await transactionService.create(user, payload);

      expect(opts.repository.createTransaction).toBeCalledWith(expected);
    });

    it('should call request payment with generated transaction id', async () => {
      opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
      opts.repository.createTransaction.mockResolvedValue();
      opts.paymentService.requestPayment.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };
      const expected = 'generatedTransactionId';

      await transactionService.create(user, payload);

      expect(opts.paymentService.requestPayment).toBeCalledWith(expected);
    });
  });
});
