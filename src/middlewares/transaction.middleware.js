const {
  TransactionRepository, PaymentRepository,
} = require('../repository');
const { TransactionService } = require('../services');

const transactionMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;
  const { productService, portfolioService } = res.locals;

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
  });

  Object.assign(res.locals, { transactionService });

  return next();
};
module.exports = transactionMiddleware;
