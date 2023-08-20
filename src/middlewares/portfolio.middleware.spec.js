const portfolioMiddleware = require('./portfolio.middleware');

describe('#portfolioMiddleware', () => {
  const mockReq = {
    app: {
      locals: {
        config: {},
        logger: {},
        db: {
          collection: jest.fn(),
        },
      },
    },
  };
  const mockRes = {
    locals: {},
  };
  const mockNext = jest.fn();
  it('should assign account service into app.locals', () => {
    portfolioMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.locals.portfolioService).toBeDefined();
  });
});
