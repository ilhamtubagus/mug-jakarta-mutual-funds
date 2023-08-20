class PortfolioService {
  constructor({ repository, logger }) {
    this.repository = repository;
    this.logger = logger;
  }

  async get(user) {
    this.logger.info(`trying to get portfolio for cif: ${user.cif}`);

    const { cif } = user;
    const portfolios = await this.repository.findByCif(cif);

    return portfolios;
  }

  async create(user, portfolioName) {
    const { cif } = user;

    this.logger.info(`trying to new portfolio for cif: ${cif}`);

    const ownedPortfolio = await this.repository.findByCif(cif);
    let portfolioCode = '001';

    if (ownedPortfolio && ownedPortfolio.length) {
      portfolioCode = `00${ownedPortfolio.length + 1}`;
    }

    const portfolioData = {
      cif,
      portfolioCode,
      name: portfolioName,
      products: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    return this.repository.create(portfolioData);
  }
}

module.exports = PortfolioService;
