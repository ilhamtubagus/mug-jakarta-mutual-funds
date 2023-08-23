const CustomError = require('../utils/error');
const constants = require('../constants');

const { TRANSACTION_STATUS: { SETTLED, FAILED } } = constants;

class PaymentService {
  constructor({
    repository, logger, transactionService,
  }) {
    this.repository = repository;
    this.logger = logger;
    this.transactionService = transactionService;
  }

  async _handleSettledPayment(paymentCode) {
    const paymentRequest = await this.repository.findOne(paymentCode);

    if (!paymentRequest) {
      throw new CustomError('Invalid Payment Code', 400);
    }

    await this.transactionService.approveTransaction(paymentRequest.transactionID);
  }

  async processPayment(payload) {
    const { status, paymentCode } = payload;

    const paymentHandler = {
      [SETTLED]: async () => this._handleSettledPayment(paymentCode),
      [FAILED]: () => {},
    };

    const processPayment = paymentHandler[`${status}`];

    if (!processPayment) {
      throw new CustomError('Invalid payment status', 400);
    }

    this.logger.info(`Handling ${status} payment with paymentCode: ${paymentCode}`);

    return processPayment();
  }
}

module.exports = PaymentService;
