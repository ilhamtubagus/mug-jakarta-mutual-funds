const accountMiddleware = require('./account.middleware');
const authenticationMiddleware = require('./authentication.middleware');
const productMiddleware = require('./product.middleware');
const portfolioMiddleware = require('./portfolio.middleware');

module.exports = {
  accountMiddleware,
  authenticationMiddleware,
  productMiddleware,
  portfolioMiddleware,
};
