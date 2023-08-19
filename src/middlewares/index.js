const accountMiddleware = require('./account.middleware');
const authenticationMiddleware = require('./authentication.middleware');
const portfolioMiddleware = require('./services/portfolio.middleware');

module.exports = {
  accountMiddleware,
  authenticationMiddleware,
  portfolioMiddleware
};
