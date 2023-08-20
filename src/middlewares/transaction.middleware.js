const { TransactionRepository, PaymentRepository, ProductRepository } = require('../repository');
const { TransactionService, PaymentService, ProductService } = require('../services');

const transactionMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;

  const paymentCollection = db.collection('paymentRequest');
  const paymentRepository = new PaymentRepository({ collection: paymentCollection, logger });
  const paymentService = new PaymentService({
    repository: paymentRepository,
    logger,
  });

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
    paymentService,
  });

  Object.assign(res.locals, { transactionService });

  return next();
};
module.exports = transactionMiddleware;
