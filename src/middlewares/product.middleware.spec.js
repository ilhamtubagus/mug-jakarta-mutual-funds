const productMiddleware = require('./product.middleware');

describe('#productMiddleware', () => {
  const mockReq = {
    app: {
      locals: {
        config: {},
        db: {
          collection: jest.fn(),
        },
        logger: {},
      },
    },
  };
  const mockRes = {
    locals: {},
  };
  const mockNext = jest.fn();
  it('should assign product service into app.locals', () => {
    productMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.locals.productService).toBeDefined();
  });
});
