const CustomError = require('../utils/error');
const { generateId } = require('../utils/generator');
const constants = require('../constants');

const { TRANSACTION_TYPE: { SELL, BUY }, TRANSACTION_STATUS: { PENDING } } = constants;

class TransactionService {
  constructor({
    repository, logger, paymentService, productService,
  }) {
    this.repository = repository;
    this.logger = logger;
    this.paymentService = paymentService;
    this.productService = productService;
  }

  static _calculatePurchaseUnit(amount, nav) {
    const units = amount / nav;
    return units.toFixed(4).toString();
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
    console.log('units', units);

    return {
      cif,
      transactionID: generateId(15),
      amount: amount.toFixed(2),
      units,
      product,
      type,
      portfolioCode,
      status: PENDING,
    };
  }

  async _handleBuyTransaction(cif, payload) {
    const { productCode } = payload;
    const product = await this.productService.findOneByProductCode(productCode);
    const constructedProduct = TransactionService._constructProductData(product);
    const transactionData = TransactionService
      ._constructBuyTransactionData(cif, payload, constructedProduct);

    this.logger.info(`Trying to create transaction and payment request for cif: ${cif}`);

    const [, paymentRequest] = await Promise.all([
      this.repository.createTransaction(transactionData),
      this.paymentService.requestPayment(transactionData.transactionID),
    ]);

    return paymentRequest;
  }

  async create(user, payload) {
    const { type } = payload;
    const { cif } = user;

    const transactionHandler = {
      [BUY]: async () => this._handleBuyTransaction(cif, payload),
      [SELL]: () => { console.log('jancuk'); },
    };

    const processTransaction = transactionHandler[`${type}`];

    if (!processTransaction) {
      throw new CustomError('Invalid transaction type', 400);
    }

    this.logger.info(`Creating ${type} transaction for cif: ${cif}`);

    return processTransaction();
  }
}

module.exports = TransactionService;
