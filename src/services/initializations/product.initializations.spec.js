const productInitializations = require('./product.initializations');

describe('#productInitializations', () => {
  const mockApp = {
    locals: {
      config: {},
      atlasFunctions: {
      },
      logger: {},
    },
  };
  it('should assign product service into app.locals.services', () => {
    productInitializations(mockApp);

    expect(mockApp.locals.services.productService).toBeDefined();
  });
});
