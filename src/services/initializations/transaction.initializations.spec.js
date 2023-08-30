const transactionInitializations = require('./transaction.initializations');

describe('#transactionInitializations', () => {
  const mockApp = {
    locals: {
      logger: {},
      db: {
        collection: jest.fn(),
      },
      config: {
        paymentExpiration: 1,
      },
      services: {
        productService: jest.fn(),
        portfolioService: jest.fn(),
      },
    },
  };
  it('should assign transaction service into app.locals.services', () => {
    transactionInitializations(mockApp);

    expect(mockApp.locals.services.transactionService).toBeDefined();
  });
});
