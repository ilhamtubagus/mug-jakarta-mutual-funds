const PortfolioService = require('../portfolio.service');

const portfolioInitializations = (app) => {
  const { logger, atlasFunctions } = app.locals;
  const repository = atlasFunctions;
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
