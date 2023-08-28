class PaymentRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async create(paymentRequestData, session) {
    const { transactionID } = paymentRequestData;

    this.logger.info(`Create payment request for transactionID ${transactionID}`);

    const options = {
      ...(session) && { session },
    };

    return this.collection.insertOne(paymentRequestData, options);
  }

  async findOne(paymentCode) {
    this.logger.info(`Finding payment request with paymentCode ${paymentCode}`);

    return this.collection.findOne({ paymentCode });
  }
}

module.exports = PaymentRepository;
