const moment = require('moment');
const mockDate = require('mockdate');
const { TransactionService } = require('./index');
const {
  products, navs, transactions, portfolios,
} = require('../fixtures');
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
  delete mockProduct.createdAt;
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
        update: jest.fn(),
        find: jest.fn(),
      },
      logger: {
        info: jest.fn(),
      },
      paymentRepository: {
        create: jest.fn(),
        findOne: jest.fn(),
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
        kafka: {
          topics: {
            sellResult: 'MF_SELL_RESULT',
          },
        },
      },
      mongoClient: {
        startSession: jest.fn().mockImplementation(() => startSession),
      },
      producer: {
        send: jest.fn(),
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
    describe('BUY', () => {
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

    describe('SELL', () => {
      it('should throw error when portfolio is not found', async () => {
        opts.portfolioService.findOne.mockReturnValue(null);
        const payload = {
          units: 10,
          productCode: 'SCHE',
          type: 'SELL',
          portfolioCode: '001',
        };

        await expect(transactionService.create(user, payload))
          .rejects.toThrow(new CustomError('Portfolio with code 001 not found', 400));
      });

      it('should throw error when product to be sell is not in portfolio', async () => {
        opts.portfolioService.findOne.mockReturnValue(portfolios[0]);
        const payload = {
          units: 10,
          productCode: 'SCHPU',
          type: 'SELL',
          portfolioCode: '001',
        };

        await expect(transactionService.create(user, payload))
          .rejects.toThrow(new CustomError('Product is not found in your portfolio', 400));
      });

      it('should throw error when current product units in portfolio is lower that requested units to sell', async () => {
        opts.portfolioService.findOne.mockReturnValue(portfolios[0]);
        const payload = {
          units: 101,
          productCode: 'SCHE',
          type: 'SELL',
          portfolioCode: '001',
        };

        await expect(transactionService.create(user, payload))
          .rejects.toThrow(new CustomError('Available units is not sufficient', 400));
      });

      it('should throw error when product is not found in product repository', async () => {
        opts.portfolioService.findOne.mockReturnValue(portfolios[0]);
        opts.productService.findOneByProductCode.mockResolvedValue(null);
        const payload = {
          units: 10,
          productCode: 'SCHE',
          type: 'SELL',
          portfolioCode: '001',
        };

        await expect(transactionService.create(user, payload))
          .rejects.toThrow(new CustomError(`Product with code ${payload.productCode} not found`, 400));
      });

      it('should call create transaction with constructed transaction data', async () => {
        opts.portfolioService.findOne.mockReturnValue(portfolios[0]);
        opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
        const payload = {
          units: 10,
          productCode: 'SCHE',
          type: 'SELL',
          portfolioCode: '001',
        };
        const expected = {
          ...payload,
          transactionID: 'generatedId',
          cif: user.cif,
          product: {
            ...mockProduct,
            nav: mockProduct.nav.currentValue,
          },
          status: 'PENDING',
        };
        delete expected.productCode;

        await transactionService.create(user, payload);

        expect(opts.repository.create).toBeCalledWith(expected);
      });
    });
  });

  describe('#updateTransaction', () => {
    it('should throw error when transaction status is not valid', async () => {
      const payload = {
        status: 'FINISHED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
      };

      await expect(transactionService.updateTransaction(payload))
        .rejects.toThrow(new CustomError('Invalid transaction status', 400));
    });

    describe('SETTLED status', () => {
      it('should throw error when transaction is not found', async () => {
        const payload = {
          status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        opts.repository.findOne.mockResolvedValue(null);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError('Transaction not found', 400));
      });

      it('should throw error when product is not found', async () => {
        const payload = {
          status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        opts.repository.findOne.mockResolvedValue(transactions[0]);
        opts.productService.findOneByProductCode.mockResolvedValue(null);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError(`Product with code ${transactions[0].product.productCode} not found`, 400));
      });

      describe('BUY transaction', () => {
        it('should throw error when transaction is already approved', async () => {
          const payload = {
            status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
          };
          opts.repository.findOne.mockResolvedValue({ ...transactions[0], status: 'SETTLED' });
          opts.productService.findOneByProductCode.mockResolvedValue(null);

          await expect(transactionService.updateTransaction(payload))
            .rejects.toThrow(new CustomError('Transaction already updated', 400));
        });

        it('should throw error when payment request is not found', async () => {
          const payload = {
            status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
          };
          opts.repository.findOne.mockResolvedValue(transactions[0]);
          opts.productService.findOneByProductCode.mockResolvedValue({
            ...products[0],
            nav: {
              currentValue: 10000,
            },
          });
          opts.paymentRepository.findOne.mockResolvedValue(null);
          opts.portfolioService.findOne.mockReturnValue(portfolios[0]);

          await expect(transactionService.updateTransaction(payload))
            .rejects.toThrow(new CustomError(`Payment code ${payload.paymentCode} not found`, 400));
        });

        it('should throw error when transactionID found in payment request is not match with given transaction', async () => {
          const paymentCode = 'YIP9YIYUKPQDSOA';
          const { transactionID } = transactions[0];
          const payload = {
            status: 'SETTLED', transactionID, paymentCode,
          };
          opts.repository.findOne.mockResolvedValue(transactions[0]);
          opts.productService.findOneByProductCode.mockResolvedValue({
            ...products[0],
            nav: {
              currentValue: 10000,
            },
          });
          opts.paymentRepository.findOne.mockResolvedValue({
            paymentCode,
            transactionID: 'YIP9YIYUKPQDSOQ',
          });
          opts.portfolioService.findOne.mockReturnValue(portfolios[0]);

          await expect(transactionService.updateTransaction(payload))
            .rejects.toThrow(new CustomError(`Invalid payment code ${payload.paymentCode}`, 400));
        });

        it('should process buy transaction when product buyFee is exist', async () => {
          const paymentCode = 'YIP9YIYUKPQDSOA';
          const { transactionID } = transactions[0];
          const payload = {
            status: 'SETTLED', transactionID, paymentCode: 'YIP9YIYUKPQDSOA',
          };
          const mockTransaction = { ...transactions[0], product: mockProduct };
          opts.repository.findOne.mockResolvedValue(mockTransaction);
          opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
          opts.paymentRepository.findOne.mockResolvedValue({
            paymentCode,
            transactionID,
          });
          const calculatedUnits = (mockTransaction.amount
              - (mockTransaction.amount * mockProduct.buyFee)) / mockProduct.nav.currentValue;
          opts.repository.update.mockResolvedValue({
            value: {
              ...mockTransaction,
              status: 'SETTLED',
              units: calculatedUnits,
              product: {
                ...mockProduct,
                nav: mockProduct.nav.currentValue,
              },
            },
          });
          opts.portfolioService.findOne.mockReturnValue(portfolios[0]);

          await transactionService.updateTransaction(payload);

          expect(opts.repository.update).toBeCalledWith(transactionID, {
            status: 'SETTLED',
            product: {
              ...mockProduct,
              nav: mockProduct.nav.currentValue,
            },
            units: calculatedUnits,
          });
          const expectedProductData = {
            productCode: mockProduct.productCode,
            units: calculatedUnits,
            capitalInvestment: mockTransaction.amount,
          };
          expect(opts.portfolioService.updateOwnedProduct)
            .toBeCalledWith(
              mockTransaction.cif,
              mockTransaction.portfolioCode,
              expectedProductData,
            );
        });

        it('should process buy transaction status when product tax is exist', async () => {
          const paymentCode = 'YIP9YIYUKPQDSOA';
          const { transactionID } = transactions[0];
          const payload = {
            status: 'SETTLED', transactionID, paymentCode: 'YIP9YIYUKPQDSOA',
          };
          const mockProductWithTax = {
            ...mockProduct,
            buyFee: 0,
            tax: 0.01,
          };
          const mockTransaction = { ...transactions[0], product: mockProductWithTax };
          opts.repository.findOne.mockResolvedValue(mockTransaction);
          opts.productService.findOneByProductCode.mockResolvedValue(mockProductWithTax);
          opts.paymentRepository.findOne.mockResolvedValue({
            paymentCode,
            transactionID,
          });
          const calculatedUnits = (mockTransaction.amount
                  - (mockTransaction.amount * mockProductWithTax.tax))
              / mockProductWithTax.nav.currentValue;
          opts.repository.update.mockResolvedValue({
            value: {
              ...mockTransaction,
              status: 'SETTLED',
              units: calculatedUnits,
              product: {
                ...mockProductWithTax,
                nav: mockProductWithTax.nav.currentValue,
              },
            },
          });
          opts.portfolioService.findOne.mockReturnValue(portfolios[0]);

          await transactionService.updateTransaction(payload);

          expect(opts.repository.update).toBeCalledWith(transactionID, {
            status: 'SETTLED',
            product: {
              ...mockProductWithTax,
              nav: mockProductWithTax.nav.currentValue,
            },
            units: calculatedUnits,
          });
          const expectedProductData = {
            productCode: mockProductWithTax.productCode,
            units: calculatedUnits,
            capitalInvestment: mockTransaction.amount,
          };
          expect(opts.portfolioService.updateOwnedProduct)
            .toBeCalledWith(
              mockTransaction.cif,
              mockTransaction.portfolioCode,
              expectedProductData,
            );
        });
      });

      describe('SELL transaction', () => {
        it('should throw error when product is not found in portfolio', async () => {
          const mockTransaction = {
            ...transactions[1],
            product: {
              ...transactions[1].product,
              productCode: 'SCHE',
            },
          };
          const { transactionID } = mockTransaction;
          const payload = {
            status: 'SETTLED', transactionID,
          };
          opts.repository.findOne.mockResolvedValue(mockTransaction);
          opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
          opts.portfolioService.findOne.mockReturnValue(portfolios[1]);

          await expect(transactionService.updateTransaction(payload))
            .rejects.toThrow(new CustomError('Product is not found in your portfolio', 400));
        });

        it('should throw error when units product in portfolio not sufficient', async () => {
          const mockTransaction = {
            ...transactions[1],
            units: 99999999,
          };
          const { transactionID } = mockTransaction;
          const payload = {
            status: 'SETTLED', transactionID,
          };
          opts.repository.findOne.mockResolvedValue(mockTransaction);
          opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
          opts.portfolioService.findOne.mockReturnValue(portfolios[1]);

          try {
            await transactionService.updateTransaction(payload);
          } catch (e) {
            expect(opts.repository.update).toBeCalledWith(transactionID, {
              status: 'FAILED',
              product: { ...mockProduct, nav: navs[0].currentValue },
              failReason: 'Available units is not sufficient',
            });
            expect(e).toStrictEqual(new CustomError('Available units is not sufficient', 400));
          }
        });

        it('should process sell transaction status when product sell fee is exist', async () => {
          const mockTransaction = {
            ...transactions[1],
          };
          const { transactionID, cif, portfolioCode } = mockTransaction;
          const payload = {
            status: 'SETTLED', transactionID,
          };
          const grossAmount = (mockTransaction.units * mockProduct.nav.currentValue);
          const calculatedAmount = grossAmount - (grossAmount * mockProduct.sellFee);
          opts.repository.findOne.mockResolvedValue(mockTransaction);
          opts.productService.findOneByProductCode.mockResolvedValue(mockProduct);
          opts.portfolioService.findOne.mockReturnValue(portfolios[1]);
          opts.repository.update.mockResolvedValue({
            value: {
              ...mockTransaction,
              status: 'SETTLED',
              amount: calculatedAmount,
              product: {
                ...mockProduct,
                nav: mockProduct.nav.currentValue,
              },
            },
          });

          await transactionService.updateTransaction(payload);

          const expectedProductData = {
            productCode: mockProduct.productCode,
            units: -mockTransaction.units,
            capitalInvestment: -calculatedAmount,
          };
          expect(opts.portfolioService.updateOwnedProduct).toBeCalledWith(
            cif,
            portfolioCode,
            expectedProductData,
          );
        });

        it('should process sell transaction status when product tax is exist', async () => {
          const mockTransaction = {
            ...transactions[1],
          };
          const { transactionID, cif, portfolioCode } = mockTransaction;
          const payload = {
            status: 'SETTLED', transactionID,
          };
          const mockProductWithTax = {
            ...mockProduct,
            tax: 0.01,
          };
          const grossAmount = (mockTransaction.units * mockProductWithTax.nav.currentValue);
          const calculatedAmount = grossAmount - (grossAmount * mockProductWithTax.tax);
          opts.repository.findOne.mockResolvedValue(mockTransaction);
          delete mockProductWithTax.sellFee;
          opts.productService.findOneByProductCode.mockResolvedValue(mockProductWithTax);
          opts.portfolioService.findOne.mockReturnValue(portfolios[1]);
          opts.repository.update.mockResolvedValue({
            value: {
              ...mockTransaction,
              status: 'SETTLED',
              amount: calculatedAmount,
              product: {
                ...mockProductWithTax,
                nav: mockProductWithTax.nav.currentValue,
              },
            },
          });

          await transactionService.updateTransaction(payload);

          const expectedProductData = {
            productCode: mockProductWithTax.productCode,
            units: -mockTransaction.units,
            capitalInvestment: -calculatedAmount,
          };
          expect(opts.portfolioService.updateOwnedProduct).toBeCalledWith(
            cif,
            portfolioCode,
            expectedProductData,
          );
        });
      });
    });

    describe('FAILED status', () => {
      it('should throw error when transaction is not found', async () => {
        const payload = {
          status: 'FAILED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        opts.repository.findOne.mockResolvedValue(null);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError('Transaction not found', 400));
      });

      it('should throw error when transaction is SETTLED', async () => {
        const payload = {
          status: 'FAILED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        const mockTransaction = {
          ...transactions[0],
          status: 'SETTLED',
        };
        opts.repository.findOne.mockResolvedValue(mockTransaction);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError('Transaction already updated', 400));
      });

      it('should throw error when transaction is FAILED', async () => {
        const payload = {
          status: 'FAILED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        const mockTransaction = {
          ...transactions[0],
          status: 'FAILED',
        };
        opts.repository.findOne.mockResolvedValue(mockTransaction);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError('Transaction already updated', 400));
      });

      it('should update transaction to FAILED', async () => {
        const payload = {
          status: 'FAILED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        const mockTransaction = {
          ...transactions[0],
          status: 'PENDING',
        };
        const { transactionID } = payload;
        opts.repository.findOne.mockResolvedValue(mockTransaction);

        await transactionService.updateTransaction(payload);

        expect(opts.repository.update).toBeCalledWith(transactionID, {
          status: 'FAILED',
        });
      });

      it('should update transaction to FAILED when fail reason is supplied', async () => {
        const payload = {
          status: 'FAILED',
          transactionID: 'YIP9YIYUKPQDSOW',
          paymentCode: 'YIP9YIYUKPQDSOA',
          failReason: 'Product on hold',
        };
        const mockTransaction = {
          ...transactions[0],
          status: 'PENDING',
        };
        const { transactionID } = payload;
        opts.repository.findOne.mockResolvedValue(mockTransaction);

        await transactionService.updateTransaction(payload);

        expect(opts.repository.update).toBeCalledWith(transactionID, {
          status: 'FAILED',
          failReason: payload.failReason,
        });
      });
    });

    describe('#getTransactionHistory', () => {
      it('should call transaction repository find', async () => {
        const payload = {
          transactionType: 'BUY',
          sortBy: 'amount',
          page: 1,
        };
        await transactionService.getTransactionHistory(user, payload);
      });
    });
  });
});
