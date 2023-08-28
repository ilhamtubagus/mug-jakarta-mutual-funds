class TransactionRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async create(transactionData, session = null) {
    const { transactionID, cif } = transactionData;

    this.logger.info(`Create transaction with transactionID ${transactionID} for cif ${cif}`, transactionData);

    const transaction = {
      ...transactionData,
      modifiedAt: new Date(),
      createdAt: new Date(),
    };

    const options = {
      ...(session) && { session },
    };

    return this.collection.insertOne(transaction, options);
  }

  async findOne(transactionID) {
    this.logger.info(`Finding transaction with transactionID ${transactionID}`);

    return this.collection.findOne({ transactionID });
  }

  async update(transactionID, payload) {
    this.logger.info(`Update status for transactionID ${transactionID} with status ${payload.status}`);
    const query = { transactionID };
    const update = { $set: { ...payload }, $currentDate: { modifiedAt: true } };
    const options = { returnDocument: 'after' };

    return this.collection.findOneAndUpdate(query, update, options);
  }
}

module.exports = TransactionRepository;
