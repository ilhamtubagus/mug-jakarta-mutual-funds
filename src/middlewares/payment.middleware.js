const { PaymentRepository, TransactionRepository, ProductRepository } = require('../repository');
const { PaymentService, TransactionService, ProductService } = require('../services');

const paymentMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;
  const transactionCollection = db.collection('transactions');
  const transactionRepository = new TransactionRepository({
    collection: transactionCollection,
    logger,
  });

  const paymentCollection = db.collection('paymentRequests');
  const paymentRepository = new PaymentRepository({ collection: paymentCollection, logger });

  const productCollection = db.collection('products');
  const productRepository = new ProductRepository({ collection: productCollection, logger });
  const productService = new ProductService({
    repository: productRepository,
    logger,
  });

  const transactionService = new TransactionService({
    repository: transactionRepository,
    logger,
    paymentRepository,
    productService,
  });
  const paymentService = new PaymentService({
    repository: paymentRepository,
    logger,
    transactionService,
  });

  Object.assign(res.locals, { paymentService });

  return next();
};
module.exports = paymentMiddleware;
