const net = require('net');
const moment = require('moment');
const CustomError = require('../utils/error');
const { generateId } = require('../utils/generator');
const constants = require('../constants');

const { TRANSACTION_TYPE: { BUY, SELL }, TRANSACTION_STATUS: { PENDING, SETTLED } } = constants;

class TransactionService {
  constructor({
    repository, logger, paymentRepository, productService, portfolioService, config, mongoClient,
  }) {
    this.repository = repository;
    this.logger = logger;
    this.paymentRepository = paymentRepository;
    this.productService = productService;
    this.portfolioService = portfolioService;
    this.config = config;
    this.mongoClient = mongoClient;
  }

  static _constructProductData(product) {
    const { nav: { currentValue }, createdAt, ...restProduct } = product;
    return {
      ...restProduct,
      nav: currentValue,
    };
  }

  static _isBuyTransaction = (type) => type === BUY;

  static _constructTransactionData(cif, payload, product) {
    const { type, portfolioCode } = payload;

    return {
      transactionID: generateId(15),
      cif,
      ...(TransactionService._isBuyTransaction(type) && { amount: payload.amount }),
      product,
      type,
      status: PENDING,
      portfolioCode,
    };
  }

  async _getProduct(productCode) {
    let product = await this.productService.findOneByProductCode(productCode);

    if (!product) {
      throw new CustomError(`Product with code ${productCode} not found`, 400);
    }

    product = TransactionService._constructProductData(product);
    return product;
  }

  async _getPortfolio(cif, portfolioCode) {
    const portfolio = await this.portfolioService.findOne(cif, portfolioCode);

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

    const session = this.mongoClient.startSession();

    try {
      await session.withTransaction(async () => {
        await Promise.all([
          this.repository.create(transactionData, session),
          this.paymentRepository.create(paymentRequestData, session),
        ]);
      }, {});
    } finally {
      await session.endSession();
    }

    return { ...paymentRequestData, ...payload, status: PENDING };
  }

  async create(user, payload) {
    const { type } = payload;
    const { cif } = user;

    const transactionHandler = {
      [BUY]: async () => this._handleBuyTransaction(cif, payload),
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
    const paymentRequest = await this.paymentRepository.findOne(paymentCode);

    if (!paymentRequest) {
      throw new CustomError(`Payment code ${paymentCode} not found`, 400);
    }

    if (paymentRequest.transactionID !== transaction.transactionID) {
      throw new CustomError(`Invalid payment code ${paymentCode}`, 400);
    }

    const { transactionID } = transaction;
    const { value: updatedTransaction } = await this.repository.update(transactionID, {
      status: SETTLED,
      product,
      units: TransactionService._calculateUnits(product, transaction),
    });

    return updatedTransaction;
  }

  async _getTransaction(transactionID) {
    const transaction = await this.repository.findOne(transactionID);

    if (!transaction) {
      throw new CustomError('Transaction not found', 400);
    }

    if (transaction.status === SETTLED) {
      throw new CustomError('Transaction already approved', 400);
    }

    return transaction;
  }

  async _approveTransaction(payload) {
    const { transactionID } = payload;
    const transaction = await this._getTransaction(transactionID);

    const { product: { productCode } } = transaction;
    const product = await this._getProduct(productCode);

    const updateTransaction = {
      [BUY]: async () => this._updateBuyTransaction(transaction, product, payload.paymentCode),
    };

    const updatedTransaction = await updateTransaction[transaction.type]();

    const {
      cif, units, portfolioCode, amount,
    } = updatedTransaction;
    const productData = { productCode, units, capitalInvestment: amount };

    this.logger.info('ProductData', productData);

    await this.portfolioService.updateOwnedProduct(cif, portfolioCode, productData);
  }

  async updateTransaction(payload) {
    const { status, transactionID } = payload;

    const transactionHandler = {
      [SETTLED]: async () => this._approveTransaction(payload),
    };

    const processUpdate = transactionHandler[`${status}`];

    if (!processUpdate) {
      throw new CustomError('Invalid transaction status', 400);
    }

    this.logger.info(`Handling ${status} transaction with transactionID: ${transactionID}`);

    return processUpdate();
  }
}

module.exports = TransactionService;
