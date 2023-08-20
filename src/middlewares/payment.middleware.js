const { PaymentRepository } = require('../repository');
const { PaymentService } = require('../services');

const paymentMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;
  const collection = db.collection('paymentRequest');
  const repository = new PaymentRepository({ collection, logger });
  const paymentService = new PaymentService({
    repository,
    logger,
  });

  Object.assign(res.locals, { paymentService });

  return next();
};
module.exports = paymentMiddleware;
