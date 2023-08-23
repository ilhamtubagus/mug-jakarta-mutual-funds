const { PaymentRepository } = require('../repository');
const { PaymentService } = require('../services');

const paymentMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;
  const { transactionService } = res.locals;

  const paymentCollection = db.collection('paymentRequests');
  const paymentRepository = new PaymentRepository({ collection: paymentCollection, logger });

  const paymentService = new PaymentService({
    repository: paymentRepository,
    logger,
    transactionService,
  });

  Object.assign(res.locals, { paymentService });

  return next();
};
module.exports = paymentMiddleware;
