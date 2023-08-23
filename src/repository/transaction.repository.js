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

  async findOne(transactionID) {
    this.logger.info(`Finding transaction with transactionID ${transactionID}`);

    return this.collection.findOne({ transactionID });
  }

  async updateStatus(transactionID, status) {
    this.logger.info(`Update status for transactionID ${transactionID} with status ${status}`);
    const query = { transactionID };
    const update = { $set: { status } };
    const options = { new: true };

    return this.collection.findOneAndUpdate(query, update, options);
  }
}

module.exports = TransactionRepository;
