const { mapPortfolioProduct } = require('./transformation');

class PortfolioService {
  constructor({ repository, logger }) {
    this.repository = repository;
    this.logger = logger;
  }

  async find(user) {
    this.logger.info(`Trying to get portfolio for cif: ${user.cif}`);

    const { cif } = user;
    return this.repository.findByCif(cif);
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

  async updateOwnedProduct(cif, portfolioCode, productData) {
    const portfolio = await this.repository.findOne(cif, portfolioCode);
    const ownedProducts = portfolio.products;
    const updatedProduct = mapPortfolioProduct(ownedProducts, productData);

    return this.repository.updateOne(cif, portfolioCode, updatedProduct);
  }

  async findOne(cif, portfolioCode) {
    return this.repository.findOne(cif, portfolioCode);
  }
}

module.exports = PortfolioService;
