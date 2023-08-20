const { accountMiddleware } = require('./index');

describe('#accountMiddleware', () => {
  const mockReq = {
    app: {
      locals: {
        config: {},
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
    accountMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.locals.accountService).toBeDefined();
  });
});
