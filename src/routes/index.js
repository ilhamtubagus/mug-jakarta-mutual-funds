const account = require('./account.js');
const product = require('./product');
const portfolio = require('./portfolio.js');
const transaction = require('./transaction.js');

const routes = [account, product, portfolio, transaction];
module.exports = routes;
