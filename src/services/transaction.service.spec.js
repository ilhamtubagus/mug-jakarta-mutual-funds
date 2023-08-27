const moment = require('moment');
const mockDate = require('mockdate');
const { TransactionService } = require('./index');
const { products, navs, transactions } = require('../fixtures');
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
  const mockTransaction = transactions[0];
  const mockPaymentRequest = {
    transactionID: 'generatedId',
    paymentCode: 'generatedId',
    expiredAt: tomorrow,
  };
  let opts;
  let transactionService;

  beforeEach(() => {
    opts = {
      repository: {
        createTransaction: jest.fn(),
        findOne: jest.fn(),
        updateStatus: jest.fn(),
      },
      logger: {
        info: jest.fn(),
      },
      paymentRepository: {
        createPaymentRequest: jest.fn(),
      },
      productService: {
        findOneByProductCode: jest.fn(),
      },
      portfolioService: {
        updateOwnedProduct: jest.fn(),
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
      opts.repository.createTransaction.mockResolvedValue();
      opts.paymentRepository.createPaymentRequest.mockResolvedValue(mockPaymentRequest);
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
      opts.paymentRepository.createPaymentRequest.mockResolvedValue(mockPaymentRequest);
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
      opts.paymentRepository.createPaymentRequest.mockResolvedValue(mockPaymentRequest);
      const payload = {
        amount: 20000,
        productCode: 'SCHE',
        type: 'BUY',
        portfolioCode: '001',
      };

      await transactionService.create(user, payload);

      expect(opts.paymentRepository.createPaymentRequest).toBeCalledWith(mockPaymentRequest);
    });
  });
  describe('#approveTransaction', () => {
    it('should call updateOwnedProduct of portfolioService with cif, portfolioCode, and product data', async () => {
      opts.repository.findOne.mockResolvedValue(mockTransaction);
      opts.repository.updateStatus.mockResolvedValue({
        value: {
          ...mockTransaction,
          status: 'SETTLED',
        },
      });
      const {
        transactionID, cif, portfolioCode, product: { productCode }, amount, units,
      } = mockTransaction;
      const productData = {
        productCode,
        units,
        capitalInvestment: amount,
      };

      await transactionService.approveTransaction(transactionID);

      expect(opts.portfolioService.updateOwnedProduct)
        .toBeCalledWith(...[cif, portfolioCode, productData]);
    });

    it('should throw Custom Error when transaction is already settled', async () => {
      opts.repository.findOne.mockResolvedValue({
        ...mockTransaction,
        status: 'SETTLED',
      });
      const { transactionID } = mockTransaction;

      await expect(transactionService.approveTransaction(transactionID))
        .rejects.toThrow(new CustomError('Transaction already approved', 400));
    });
  });
});
