const portfolioInitializations = require('./portfolio.initializations');

describe('#portfolioInitializations', () => {
  const mockApp = {
    locals: {
      config: {},
      logger: {},
      atlasFunctions: {
      },
    },
  };
  it('should assign account service into app.locals.services', () => {
    portfolioInitializations(mockApp);

    expect(mockApp.locals.services.portfolioService).toBeDefined();
  });
});
