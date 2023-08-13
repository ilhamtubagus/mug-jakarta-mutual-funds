class AccountRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async findOneByEmail(email) {
    this.logger.info(this.constructor.name, 'Get account by email');

    const query = { email };

    return this.collection.findOne(query);
  }

  async create(payload) {
    this.logger.info(this.constructor.name, `Create account for email ${payload.email}`);

    const doc = {
      ...payload, lastModified: new Date(), createdAt: new Date(),
    };

    return this.collection.insertOne(doc);
  }
}

module.exports = AccountRepository;
