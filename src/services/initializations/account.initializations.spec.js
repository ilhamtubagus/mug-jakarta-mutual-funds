const accountInitializations = require('./account.initializations');

describe('#accountInitializations', () => {
  const mockApp = {
    locals: {
      config: {},
      atlasFunctions: {
      },
    },
  };

  it('should assign account service into app.locals.services', () => {
    accountInitializations(mockApp);

    expect(mockApp.locals.services.accountService).toBeDefined();
  });
});
