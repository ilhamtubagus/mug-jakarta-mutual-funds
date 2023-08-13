const AccountRepository = require('../repository/account.repository');
const AccountService = require('../services/account.service');
const encryption = require('../utils/encryption');

const accountMiddleware = (req, res, next) => {
  const { config, db, logger } = req.app.locals;
  const collection = db.collection('accounts');
  const repository = new AccountRepository({ collection, logger });
  const accountService = new AccountService({
    encryption, repository, logger, config,
  });

  Object.assign(res.locals, { accountService });

  return next();
};
module.exports = accountMiddleware;
