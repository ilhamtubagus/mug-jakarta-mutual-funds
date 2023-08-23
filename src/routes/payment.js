const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');
const constants = require('../constants');

const { TOKEN_AUDIENCE: { PAYMENT_PROCESSOR } } = constants;

const paymentRouter = Router();

paymentRouter.post('/payments', authenticationMiddleware(PAYMENT_PROCESSOR), async (req, res, next) => {
  const {
    paymentService,
  } = res.locals;
  const {
    body: payload,
  } = req;

  try {
    const result = await paymentService.processPayment(payload);

    res.status(201).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = paymentRouter;
