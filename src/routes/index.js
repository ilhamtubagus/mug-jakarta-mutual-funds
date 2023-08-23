const account = require('./account.js');
const product = require('./product');
const portfolio = require('./portfolio.js');
const transaction = require('./transaction.js');
const payment = require('./payment.js');

const routes = [account, product, portfolio, transaction, payment];
module.exports = routes;
