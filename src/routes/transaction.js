const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');

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

  console.log(res.locals);

  try {
    const result = await transactionService.create(user, payload);

    res.status(201).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = transactionRouter;
