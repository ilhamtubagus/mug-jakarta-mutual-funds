const { accountMiddleware } = require('./index');

jest.mock('../utils/generator', () => ({
  generateId: () => 'ztYtfy7C1j',
}));

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
