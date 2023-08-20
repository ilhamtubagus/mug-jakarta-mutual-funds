const PortfolioRepository = require('../repository/portfolio.repository');
const PortfolioService = require('../services/portfolio.service');

const portfolioMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;
  const collection = db.collection('portfolios');
  const repository = new PortfolioRepository({ collection, logger });
  const portfolioService = new PortfolioService({
    repository,
    logger,
  });

  Object.assign(res.locals, { portfolioService });

  return next();
};
module.exports = portfolioMiddleware;
