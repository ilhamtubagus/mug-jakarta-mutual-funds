const moment = require('moment');
const { TransactionService } = require('./index');
const {
  products, navs, transactions, portfolios, payment,
} = require('../fixtures');
const CustomError = require('../utils/error');

const mockDate = '2023-09-01T00:00:00.000Z';
const mockExpiredDate = moment(mockDate).add(1, 'days').toDate();

jest
  .mock('../utils/generator', () => ({
    generateId: () => 'generatedId',
  }))
  .mock('moment', () => () => jest.requireActual('moment')(mockDate));

describe('TransactionService', () => {
  const user = { cif: 'QWERTY' };
  const mockProduct = {
    ...products[0],
    nav: { ...navs[0] },
  };
  delete mockProduct.createdAt;
  let opts;
  let transactionService;

  beforeEach(() => {
    opts = {
      repository: {
        createTransaction: jest.fn(),
        findTransactionByID: jest.fn(),
        updateTransaction: jest.fn(),
        findPaymentRequestByCode: jest.fn(),
      },
      logger: {
        info: jest.fn(),
      },
      productService: {
        findProductByCode: jest.fn(),
      },
      portfolioService: {
        updateOwnedProduct: jest.fn(),
        findPortfolio: jest.fn(),
      },
      config: {
        paymentExpiration: 1,
        kafka: {
          topics: {
            sellResult: 'MF_SELL_RESULT',
          },
        },
      },
      producer: {
        send: jest.fn(),
      },
    };

    transactionService = new TransactionService(opts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#create', () => {
    describe('BUY', () => {
      it('should return payment request data', async () => {
        opts.productService.findProductByCode.mockResolvedValue(mockProduct);
        opts.repository.createTransaction.mockResolvedValue({});
        opts.portfolioService.findPortfolio.mockResolvedValue({});
        const payload = {
          amount: 20000,
          productCode: 'SCHE',
          type: 'BUY',
          portfolioCode: '001',
        };
        const expectedResult = {
          ...payload,
          status: 'PENDING',
          transactionID: 'generatedId',
          paymentCode: 'generatedId',
          expiredAt: mockExpiredDate,
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
        opts.productService.findProductByCode.mockResolvedValue(mockProduct);
        opts.repository.createTransaction.mockResolvedValue();
        opts.portfolioService.findPortfolio.mockResolvedValue({ portfolioCode: '001' });
        const payload = {
          amount: 20000,
          productCode: 'SCHE',
          type: 'BUY',
          portfolioCode: '001',
        };
        const expectedPaymentRequestData = {
          transactionID: 'generatedId',
          paymentCode: 'generatedId',
          expiredAt: mockExpiredDate,
        };
        const expectedTransactionDate = {
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

        expect(opts.repository.createTransaction)
          .toBeCalledWith(expectedTransactionDate, expectedPaymentRequestData);
      });

      it('should throw error when portfolio is not found', async () => {
        opts.productService.findProductByCode.mockResolvedValue(mockProduct);
        opts.repository.createTransaction.mockResolvedValue();
        opts.portfolioService.findPortfolio.mockReturnValue(null);
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
        opts.productService.findProductByCode.mockResolvedValue(null);
        opts.repository.createTransaction.mockResolvedValue();
        opts.portfolioService.findPortfolio.mockReturnValue({ portfolioCode: '001' });
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
        opts.portfolioService.findPortfolio.mockReturnValue(null);
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
        opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);
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
        opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);
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
        opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);
        opts.productService.findProductByCode.mockResolvedValue(null);
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
        opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);
        opts.productService.findProductByCode.mockResolvedValue(mockProduct);
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

        expect(opts.repository.createTransaction).toBeCalledWith(expected);
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
        opts.repository.findTransactionByID.mockResolvedValue(null);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError('Transaction not found', 400));
      });

      it('should throw error when product is not found', async () => {
        const payload = {
          status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
        };
        opts.repository.findTransactionByID.mockResolvedValue(transactions[0]);
        opts.productService.findProductByCode.mockResolvedValue(null);

        await expect(transactionService.updateTransaction(payload))
          .rejects.toThrow(new CustomError(`Product with code ${transactions[0].product.productCode} not found`, 400));
      });

      describe('BUY transaction', () => {
        it('should throw error when transaction is already approved', async () => {
          const payload = {
            status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
          };
          opts.repository.findTransactionByID.mockResolvedValue({ ...transactions[0], status: 'SETTLED' });
          opts.productService.findProductByCode.mockResolvedValue(null);

          await expect(transactionService.updateTransaction(payload))
            .rejects.toThrow(new CustomError('Transaction already updated', 400));
        });

        it('should throw error when payment request is not found', async () => {
          const payload = {
            status: 'SETTLED', transactionID: 'YIP9YIYUKPQDSOW', paymentCode: 'YIP9YIYUKPQDSOA',
          };
          opts.repository.findTransactionByID.mockResolvedValue(transactions[0]);
          opts.productService.findProductByCode.mockResolvedValue({
            ...products[0],
            nav: {
              currentValue: 10000,
            },
          });
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);

          await expect(transactionService.updateTransaction(payload))
            .rejects.toThrow(new CustomError(`Payment code ${payload.paymentCode} not found`, 400));
        });

        it('should throw error when transactionID found in payment request is not match with given transaction', async () => {
          const paymentCode = 'YIP9YIYUKPQDSOA';
          const { transactionID } = transactions[0];
          const payload = {
            status: 'SETTLED', transactionID, paymentCode,
          };
          opts.repository.findTransactionByID.mockResolvedValue(transactions[0]);
          opts.repository.findPaymentRequestByCode.mockReturnValue(payment[0]);
          opts.productService.findProductByCode.mockResolvedValue({
            ...products[0],
            nav: {
              currentValue: 10000,
            },
          });
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);

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
          const mockPaymentRequest = {
            ...payment[0],
            paymentCode,
            transactionID: mockTransaction.transactionID,
          };
          opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);
          opts.repository.findPaymentRequestByCode.mockReturnValue(mockPaymentRequest);
          opts.productService.findProductByCode.mockResolvedValue(mockProduct);
          const calculatedUnits = (mockTransaction.amount
              - (mockTransaction.amount * mockProduct.buyFee)) / mockProduct.nav.currentValue;
          opts.repository.updateTransaction.mockResolvedValue({
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
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);

          await transactionService.updateTransaction(payload);

          expect(opts.repository.updateTransaction).toBeCalledWith({
            transactionID,
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
          const mockPaymentRequest = {
            ...payment[0],
            paymentCode,
            transactionID: mockTransaction.transactionID,
          };
          opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);
          opts.repository.findPaymentRequestByCode.mockReturnValue(mockPaymentRequest);
          opts.productService.findProductByCode.mockResolvedValue(mockProductWithTax);
          const calculatedUnits = (mockTransaction.amount
                  - (mockTransaction.amount * mockProductWithTax.tax))
              / mockProductWithTax.nav.currentValue;
          opts.repository.updateTransaction.mockResolvedValue({
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
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[0]);

          await transactionService.updateTransaction(payload);

          expect(opts.repository.updateTransaction).toBeCalledWith({
            transactionID,
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
          opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);
          opts.productService.findProductByCode.mockResolvedValue(mockProduct);
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[1]);

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
          opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);
          opts.productService.findProductByCode.mockResolvedValue(mockProduct);
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[1]);

          try {
            await transactionService.updateTransaction(payload);
          } catch (e) {
            expect(opts.repository.updateTransaction).toBeCalledWith({
              transactionID,
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
          opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);
          opts.productService.findProductByCode.mockResolvedValue(mockProduct);
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[1]);
          opts.repository.updateTransaction.mockResolvedValue({
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
          opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);
          delete mockProductWithTax.sellFee;
          opts.productService.findProductByCode.mockResolvedValue(mockProductWithTax);
          opts.portfolioService.findPortfolio.mockReturnValue(portfolios[1]);
          opts.repository.updateTransaction.mockResolvedValue({
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
        opts.repository.findTransactionByID.mockResolvedValue(null);

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
        opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);

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
        opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);

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
        opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);

        await transactionService.updateTransaction(payload);

        expect(opts.repository.updateTransaction).toBeCalledWith({
          transactionID,
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
        opts.repository.findTransactionByID.mockResolvedValue(mockTransaction);

        await transactionService.updateTransaction(payload);

        expect(opts.repository.updateTransaction).toBeCalledWith({
          transactionID,
          status: 'FAILED',
          failReason: payload.failReason,
        });
      });
    });
  });
});
