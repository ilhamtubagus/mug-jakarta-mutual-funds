const constants = require('../constants');

const { OFFSET } = constants;

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

  async findWithFilter(cif, payload) {
    this.logger.info(`Finding transaction history for cif: ${cif}`);
    const {
      transactionType, productCode, sortBy, page, order,
    } = payload;
    const filter = {
      cif,
      ...transactionType && { type: transactionType },
      ...productCode && { 'product.productCode': productCode },
    };
    const sort = {
      ...sortBy && { [sortBy]: order === 'asc' ? 1 : -1 },
    };
    const query = {
      cif,
      ...filter,
    };
    const skip = OFFSET * (parseInt(page, 10) - 1);
    const limit = skip + OFFSET;

    return this.collection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}

module.exports = TransactionRepository;
