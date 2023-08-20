class PortfolioRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async findByCif(cif) {
    this.logger.info(`Find portfolio by cif: ${cif}`);

    const query = { cif };
    return this.collection.find(query).toArray();
  }

  async insertOne(portfolioData) {
    this.logger.info(`Creating new portfolio for cif: ${portfolioData.cif}`);

    return this.collection.insertOne(portfolioData);
  }
}

module.exports = PortfolioRepository;
