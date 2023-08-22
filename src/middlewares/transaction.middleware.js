const { TransactionRepository, PaymentRepository, ProductRepository } = require('../repository');
const { TransactionService, ProductService } = require('../services');

const transactionMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;

  const paymentCollection = db.collection('paymentRequests');
  const paymentRepository = new PaymentRepository({ collection: paymentCollection, logger });

  const productCollection = db.collection('products');
  const productRepository = new ProductRepository({ collection: productCollection, logger });
  const productService = new ProductService({
    repository: productRepository,
    logger,
  });

  const collection = db.collection('transactions');
  const transactionRepository = new TransactionRepository({ collection, logger });
  const transactionService = new TransactionService({
    repository: transactionRepository,
    logger,
    productService,
    paymentRepository,
  });

  Object.assign(res.locals, { transactionService });

  return next();
};
module.exports = transactionMiddleware;
