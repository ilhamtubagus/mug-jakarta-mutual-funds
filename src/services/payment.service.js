const moment = require('moment');
const { generateId } = require('../utils/generator');
const CustomError = require('../utils/error');

class PaymentService {
  constructor({
    repository, logger,
  }) {
    this.repository = repository;
    this.logger = logger;
  }

  async requestPayment(transactionID) {
    const paymentRequestData = {
      transactionID,
      paymentCode: generateId(15),
      expiredAt: moment().add(1, 'd').toDate(),
    };

    const { acknowledged } = await this.repository.createPaymentRequest(paymentRequestData);

    if (!acknowledged) {
      throw new CustomError('Failed to create payment request');
    }

    return paymentRequestData;
  }
}

module.exports = PaymentService;
