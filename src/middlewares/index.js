const accountMiddleware = require('./account.middleware');
const authenticationMiddleware = require('./authentication.middleware');
const productMiddleware = require('./product.middleware');

module.exports = {
  accountMiddleware,
  authenticationMiddleware,
  productMiddleware,
};
