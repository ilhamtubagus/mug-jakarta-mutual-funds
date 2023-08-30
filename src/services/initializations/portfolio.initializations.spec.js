const portfolioInitializations = require('./portfolio.initializations');

describe('#portfolioInitializations', () => {
  const mockApp = {
    locals: {
      config: {},
      logger: {},
      db: {
        collection: jest.fn(),
      },
    },
  };
  it('should assign account service into app.locals.services', () => {
    portfolioInitializations(mockApp);

    expect(mockApp.locals.services.portfolioService).toBeDefined();
  });
});
