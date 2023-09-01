const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');

const transactionRouter = Router();

transactionRouter.post('/transactions', authenticationMiddleware(), async (req, res, next) => {
  const {
    auth: {
      user,
    },
  } = res.locals;
  const {
    body: payload, app: { locals: { services } },
  } = req;
  const { transactionService } = services;

  try {
    const result = await transactionService.create(user, payload);

    res.status(201).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

transactionRouter.get('/transactions', authenticationMiddleware(), async (req, res, next) => {
  const {
    auth: {
      user,
    },
  } = res.locals;
  const {
    query: payload, app: { locals: { services } },
  } = req;
  const { transactionService } = services;

  try {
    const result = await transactionService.getTransactionHistory(user, payload);

    res.status(200).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = transactionRouter;
