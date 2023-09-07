const { TransactionService } = require('../index');

const transactionInitializations = (app) => {
  const {
    atlasFunctions, logger, config, services, producer,
  } = app.locals;
  const { productService, portfolioService } = services;

  const transactionService = new TransactionService({
    repository: atlasFunctions,
    logger,
    productService,
    portfolioService,
    config,
    producer,
  });

  Object.assign(app.locals, {
    services: {
      ...app.locals.services,
      transactionService,
    },
  });
};
module.exports = transactionInitializations;
