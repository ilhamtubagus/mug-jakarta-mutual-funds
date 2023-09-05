const moment = require('moment');
const CustomError = require('../utils/error');
const { generateId } = require('../utils/generator');
const constants = require('../constants');

const {
  TRANSACTION_TYPE: { BUY, SELL }, TRANSACTION_STATUS:
    { PENDING, SETTLED, FAILED },
} = constants;

class TransactionService {
  constructor({
    repository, logger,
    productService, portfolioService, config, producer,
  }) {
    this.repository = repository;
    this.logger = logger;
    this.productService = productService;
    this.portfolioService = portfolioService;
    this.config = config;
    this.producer = producer;
  }

  static _constructProductData(product) {
    const { nav: { currentValue }, createdAt, ...restProduct } = product;
    return {
      ...restProduct,
      nav: currentValue,
    };
  }

  static _isBuyTransaction = (type) => type === BUY;

  static _isSellTransaction = (type) => type === SELL;

  static _constructTransactionData(cif, payload, product) {
    const { type, portfolioCode } = payload;

    return {
      transactionID: generateId(15),
      cif,
      ...(TransactionService._isBuyTransaction(type) && { amount: payload.amount }),
      ...(TransactionService._isSellTransaction(type) && { units: payload.units }),
      product,
      type,
      status: PENDING,
      portfolioCode,
    };
  }

  async _getProduct(productCode) {
    let product = await this.productService.findProductByCode(productCode);

    if (!product) {
      throw new CustomError(`Product with code ${productCode} not found`, 400);
    }

    product = TransactionService._constructProductData(product);
    return product;
  }

  async _getPortfolio(cif, portfolioCode) {
    const portfolio = await this.portfolioService.findPortfolio(cif, portfolioCode);

    if (!portfolio) {
      throw new CustomError(`Portfolio with code ${portfolioCode} not found`, 400);
    }

    return portfolio;
  }

  async _handleBuyTransaction(cif, payload) {
    const { productCode, portfolioCode } = payload;
    await this._getPortfolio(cif, portfolioCode);

    const constructedProduct = await this._getProduct(productCode);
    const transactionData = TransactionService
      ._constructTransactionData(cif, payload, constructedProduct);

    const { paymentExpiration } = this.config;
    const paymentRequestData = {
      transactionID: transactionData.transactionID,
      paymentCode: generateId(15),
      expiredAt: moment().add(paymentExpiration, 'd').toDate(),
    };

    this.logger.info(`Trying to create transaction and payment request for cif: ${cif}`);

    await this.repository.createTransaction(transactionData, paymentRequestData);

    return { ...paymentRequestData, ...payload, status: PENDING };
  }

  async handleSellTransaction(cif, payload) {
    const { productCode, portfolioCode, units } = payload;
    const portfolio = await this._getPortfolio(cif, portfolioCode);

    const productInPortfolio = portfolio.products
      .find((portfolioProduct) => portfolioProduct.productCode === productCode);

    if (!productInPortfolio) {
      throw new CustomError('Product is not found in your portfolio', 400);
    }

    if (productInPortfolio.units < units) {
      throw new CustomError('Available units is not sufficient', 400);
    }

    const constructedProduct = await this._getProduct(productCode);
    const transactionData = TransactionService
      ._constructTransactionData(cif, payload, constructedProduct);

    await this.repository.createTransaction(transactionData);

    return { transactionID: transactionData.transactionID, ...payload, status: PENDING };
  }

  async create(user, payload) {
    const { type } = payload;
    const { cif } = user;

    const transactionHandler = {
      [BUY]: async () => this._handleBuyTransaction(cif, payload),
      [SELL]: async () => this.handleSellTransaction(cif, payload),
    };

    const processTransaction = transactionHandler[`${type}`];

    if (!processTransaction) {
      throw new CustomError('Invalid transaction type', 400);
    }

    this.logger.info(`Creating ${type} transaction for cif: ${cif}`);

    return processTransaction();
  }

  static _calculateUnits(latestProduct, transaction) {
    const { amount } = transaction;
    const { nav, buyFee, tax } = latestProduct;
    let netAmount = amount;

    if (buyFee) {
      netAmount -= (netAmount * buyFee);
    }
    if (tax) {
      netAmount -= (netAmount * tax);
    }

    return netAmount / nav;
  }

  async _updateBuyTransaction(transaction, product, paymentCode) {
    const paymentRequest = await this.repository.findPaymentRequestByCode(paymentCode);

    if (!paymentRequest) {
      throw new CustomError(`Payment code ${paymentCode} not found`, 400);
    }

    if (paymentRequest.transactionID !== transaction.transactionID) {
      throw new CustomError(`Invalid payment code ${paymentCode}`, 400);
    }

    const { transactionID } = transaction;
    const updateTransactionPayload = {
      transactionID,
      status: SETTLED,
      product,
      units: TransactionService._calculateUnits(product, transaction),
    };
    const { value: updatedTransaction } = await this.repository
      .updateTransaction(updateTransactionPayload);

    return updatedTransaction;
  }

  async _getTransaction(transactionID) {
    const transaction = await this.repository.findTransactionByID(transactionID);

    if (!transaction) {
      throw new CustomError('Transaction not found', 400);
    }

    if (transaction.status === SETTLED || transaction.status === FAILED) {
      throw new CustomError('Transaction already updated', 400);
    }

    return transaction;
  }

  static _calculateAmount(transaction, latestProduct) {
    const { units } = transaction;
    const { sellFee, tax, nav } = latestProduct;

    let netAmount = units * nav;

    if (sellFee) {
      netAmount -= (netAmount * sellFee);
    }

    if (tax) {
      netAmount -= (netAmount * tax);
    }

    return netAmount;
  }

  async _updateSellTransaction(transaction, latestProduct, portfolio) {
    const { transactionID, product: { productCode } } = transaction;

    const productInPortfolio = portfolio.products
      .find((portfolioProduct) => portfolioProduct.productCode === productCode);

    if (!productInPortfolio) {
      throw new CustomError('Product is not found in your portfolio', 400);
    }

    if (productInPortfolio.units < transaction.units) {
      this.logger.info('Available units is not sufficient, updating transaction status to FAILED');

      const updateTransactionPayload = {
        transactionID,
        status: FAILED,
        product: latestProduct,
        failReason: 'Available units is not sufficient',
      };
      await this.repository.updateTransaction(updateTransactionPayload);

      throw new CustomError('Available units is not sufficient', 400);
    }

    const updateTransactionPayload = {
      transactionID,
      status: SETTLED,
      product: latestProduct,
      amount: TransactionService._calculateAmount(transaction, latestProduct),
    };
    const { value: updatedTransaction } = await this.repository
      .updateTransaction(updateTransactionPayload);

    return updatedTransaction;
  }

  async _sendToAggregator(transaction) {
    const { kafka: { topics: { sellResult } } } = this.config;
    const { cif, amount, modifiedAt } = transaction;
    const payload = {
      cif, amount, transactionDate: modifiedAt,
    };

    this.logger.info('Producing message to aggregator', payload);

    await this.producer.send({
      topic: sellResult,
      messages: [
        { value: JSON.stringify(payload) },
      ],
    });
  }

  async _approveTransaction(payload) {
    const { transactionID } = payload;
    const transaction = await this._getTransaction(transactionID);

    const { product: { productCode }, cif, portfolioCode } = transaction;
    const product = await this._getProduct(productCode);

    const portfolio = await this._getPortfolio(cif, portfolioCode);

    const updateTransaction = {
      [BUY]: async () => this._updateBuyTransaction(transaction, product, payload.paymentCode),
      [SELL]: async () => this._updateSellTransaction(transaction, product, portfolio),
    };

    const updatedTransaction = await updateTransaction[transaction.type]();

    const {
      units, amount, type,
    } = updatedTransaction;
    const productData = {
      productCode,
      ...(TransactionService._isBuyTransaction(type)
        ? { units, capitalInvestment: amount }
        : { units: -units, capitalInvestment: -amount }),
    };

    this.logger.info('ProductData', productData);

    await this.portfolioService.updateOwnedProduct(cif, portfolioCode, productData);

    if (TransactionService._isSellTransaction(type)) {
      await this._sendToAggregator(updatedTransaction);
    }
  }

  async _cancelTransaction(payload) {
    const { transactionID, failReason } = payload;
    await this._getTransaction(transactionID);

    const updateTransactionPayload = {
      transactionID,
      status: FAILED,
      ...(failReason && { failReason }),
    };
    await this.repository.updateTransaction(updateTransactionPayload);
  }

  async updateTransaction(payload) {
    const { status, transactionID } = payload;

    const transactionHandler = {
      [SETTLED]: async () => this._approveTransaction(payload),
      [FAILED]: async () => this._cancelTransaction(payload),
    };

    const processUpdate = transactionHandler[`${status}`];

    if (!processUpdate) {
      throw new CustomError('Invalid transaction status', 400);
    }

    this.logger.info(`Handling ${status} transaction with transactionID: ${transactionID}`);

    return processUpdate();
  }

  async getTransactionHistory(user, payload) {
    const { cif } = user;

    const result = await this.repository.findWithFilter(cif, payload);

    return result;
  }
}

module.exports = TransactionService;
