const {
  TransactionRepository, PaymentRepository,
} = require('../../repository');
const { TransactionService } = require('../index');

const transactionInitializations = (app) => {
  const {
    db, logger, config, mongoClient, services, producer,
  } = app.locals;
  const { productService, portfolioService } = services;

  const paymentCollection = db.collection('paymentRequests');
  const paymentRepository = new PaymentRepository({ collection: paymentCollection, logger });

  const collection = db.collection('transactions');
  const transactionRepository = new TransactionRepository({ collection, logger });
  const transactionService = new TransactionService({
    repository: transactionRepository,
    logger,
    paymentRepository,
    productService,
    portfolioService,
    config,
    mongoClient,
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
