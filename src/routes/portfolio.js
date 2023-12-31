const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');

const portfolioRouter = Router();

portfolioRouter.get('/portfolios', authenticationMiddleware(), async (req, res, next) => {
  const {
    auth: {
      user,
    },
  } = res.locals;
  const { portfolioService } = req.app.locals.services;

  try {
    const result = await portfolioService.getPortfolios(user);

    res.status(200).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

portfolioRouter.post('/portfolios', authenticationMiddleware(), async (req, res, next) => {
  const {
    portfolioService,
    auth: {
      user,
    },
  } = res.locals;
  const {
    body: {
      portfolioName,
    },
  } = req;

  try {
    const result = await portfolioService.create(user, portfolioName);

    res.status(201).json(result);
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = portfolioRouter;
