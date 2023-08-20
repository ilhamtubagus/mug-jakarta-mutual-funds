class TransactionRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async createTransaction(transactionData) {
    const { transactionID, cif } = transactionData;

    this.logger.info(`Create transaction with transactionID ${transactionID} for cif ${cif}`, transactionData);

    const transaction = {
      ...transactionData,
      modifiedAt: new Date(),
      createdAt: new Date(),
    };

    return this.collection.insertOne(transaction);
  }
}

module.exports = TransactionRepository;
