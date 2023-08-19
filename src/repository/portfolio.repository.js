class PortfolioRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async findByCif(cif) {
    this.logger.info(`Find portfolio by cif: ${cif}`);
    console.log('DB')

    const query = { cif };
    const portfolios = await this.collection.find(query); 

    return portfolios
  }

  async insertOne(portfolioData) {
    this.logger.info(`Creating new portfolio for cif: ${portfolioData.cif}`);

    return this.collection.insertOne(portfolioData);
  }
}

module.exports = PortfolioRepository;
