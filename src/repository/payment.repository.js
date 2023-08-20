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
}

module.exports = PaymentRepository;
