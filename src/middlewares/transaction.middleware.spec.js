const transactionMiddleware = require('./transaction.middleware');

describe('#transactionMiddleware', () => {
  const mockReq = {
    app: {
      locals: {
        logger: {},
        db: {
          collection: jest.fn(),
        },
        config: {
          paymentExpiration: 1,
        },
      },
    },
  };
  const mockRes = {
    locals: {},
  };
  const mockNext = jest.fn();
  it('should assign transaction service into app.locals', () => {
    transactionMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.locals.transactionService).toBeDefined();
  });
});
