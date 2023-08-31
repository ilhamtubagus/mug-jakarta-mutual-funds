const accountInitializations = require('./account.initializations');
const portfolioInitializations = require('./portfolio.initializations');
const productInitializations = require('./product.initializations');
const transactionInitializations = require('./transaction.initializations');

module.exports = [
  accountInitializations,
  portfolioInitializations,
  productInitializations,
  transactionInitializations,
];
