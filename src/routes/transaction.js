const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');
const constants = require('../constants');

const { TOKEN_AUDIENCE: { PAYMENT_PROCESSOR } } = constants;

const transactionRouter = Router();

transactionRouter.post('/transactions', authenticationMiddleware(), async (req, res, next) => {
  const {
    transactionService,
    auth: {
      user,
    },
  } = res.locals;
  const {
    body: payload,
  } = req;

  try {
    const result = await transactionService.create(user, payload);

    res.status(201).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

transactionRouter.patch('/transactions/:transactionID', authenticationMiddleware(PAYMENT_PROCESSOR), async (req, res, next) => {
  const {
    transactionService,
  } = res.locals;
  const {
    body,
  } = req;

  const { transactionID } = req.params;

  const payload = {
    ...body,
    transactionID,
  };

  try {
    const result = await transactionService.updateTransaction(payload);

    res.status(200).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = transactionRouter;
