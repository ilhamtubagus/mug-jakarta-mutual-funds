class AccountRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async findOneByEmail(email) {
    this.logger.info(`Get account by email ${email}`);

    const query = { email };

    return this.collection.findOne(query);
  }

  async create(payload) {
    this.logger.info(`Create account with ${JSON.stringify(payload)}`);

    const doc = {
      ...payload, lastModified: new Date(), createdAt: new Date(),
    };

    return this.collection.insertOne(doc);
  }
}

module.exports = AccountRepository;
