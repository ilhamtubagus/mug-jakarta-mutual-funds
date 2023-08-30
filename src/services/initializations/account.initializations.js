const { AccountRepository } = require('../../repository');
const { AccountService } = require('../index');
const encryption = require('../../utils/encryption');

const accountInitializations = (app) => {
  const { config, db, logger } = app.locals;
  const collection = db.collection('accounts');
  const repository = new AccountRepository({ collection, logger });
  const accountService = new AccountService({
    encryption, repository, logger, config,
  });

  Object.assign(app.locals, {
    services: {
      ...app.locals.services,
      accountService,
    },
  });
};
module.exports = accountInitializations;
