const { AccountService } = require('../index');
const encryption = require('../../utils/encryption');

const accountInitializations = (app) => {
  const { config, atlasFunctions, logger } = app.locals;
  const repository = atlasFunctions;
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
