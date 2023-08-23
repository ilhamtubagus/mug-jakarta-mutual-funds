const moment = require('moment');
const CustomError = require('../utils/error');
const { generateId } = require('../utils/generator');
const constants = require('../constants');

const { TRANSACTION_TYPE: { BUY }, TRANSACTION_STATUS: { PENDING, SETTLED } } = constants;

class TransactionService {
  constructor({
    repository, logger, paymentRepository, productService, portfolioService,
  }) {
    this.repository = repository;
    this.logger = logger;
    this.paymentRepository = paymentRepository;
    this.productService = productService;
    this.portfolioService = portfolioService;
  }

  static _calculatePurchaseUnit(amount, nav) {
    const units = amount / nav;
    return units.toFixed(4);
  }

  static _constructProductData(product) {
    const { nav: { currentValue } } = product;
    return {
      ...product,
      nav: currentValue,
    };
  }

  static _constructBuyTransactionData(cif, payload, product) {
    const { amount, type, portfolioCode } = payload;
    const { nav } = product;
    const units = TransactionService._calculatePurchaseUnit(amount, nav);

    return {
      transactionID: generateId(15),
      cif,
      amount,
      units,
      product,
      type,
      status: PENDING,
      portfolioCode,
    };
  }

  async _handleBuyTransaction(cif, payload) {
    const { productCode } = payload;
    const product = await this.productService.findOneByProductCode(productCode);
    const constructedProduct = TransactionService._constructProductData(product);
    const transactionData = TransactionService
      ._constructBuyTransactionData(cif, payload, constructedProduct);
    const paymentRequestData = {
      transactionID: transactionData.transactionID,
      paymentCode: generateId(15),
      expiredAt: moment().add(1, 'd').toDate(),
    };

    this.logger.info(`Trying to create transaction and payment request for cif: ${cif}`);

    await Promise.all([
      this.repository.createTransaction(transactionData),
      this.paymentRepository.createPaymentRequest(paymentRequestData),
    ]);

    return paymentRequestData;
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

  async approveTransaction(transactionID) {
    const transaction = await this.repository.findOne(transactionID);

    if (transaction.status === SETTLED) {
      throw new CustomError('Transaction already approved', 400);
    }
    const { value: transactionData } = await this.repository.updateStatus(transactionID, SETTLED);
    const {
      cif, units, portfolioCode, product: { productCode }, amount,
    } = transactionData;
    const productData = { productCode, units, capitalInvestment: amount };

    await this.portfolioService.updateOwnedProduct(cif, portfolioCode, productData);
  }
}

module.exports = TransactionService;
