const PortfolioRepository = require('../../repository/portfolio.repository');
const PortfolioService = require('../portfolio.service');

const portfolioInitializations = (app) => {
  const { db, logger } = app.locals;
  const collection = db.collection('portfolios');
  const repository = new PortfolioRepository({ collection, logger });
  const portfolioService = new PortfolioService({
    repository,
    logger,
  });

  Object.assign(app.locals, {
    services: {
      ...app.locals.services,
      portfolioService,
    },
  });
};
module.exports = portfolioInitializations;
