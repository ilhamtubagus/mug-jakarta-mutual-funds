class PaymentRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async createPaymentRequest(paymentRequestData) {
    const { transactionID } = paymentRequestData;

    this.logger.info(`Create payment request for transactionID ${transactionID}`);

    return this.collection.insertOne(paymentRequestData);
  }

  async findOne(paymentCode) {
    this.logger.info(`Finding payment request with paymentCode ${paymentCode}`);

    return this.collection.findOne(paymentCode);
  }
}

module.exports = PaymentRepository;
