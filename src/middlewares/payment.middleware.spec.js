const paymentMiddleware = require('./payment.middleware');

describe('#paymentMiddleware', () => {
  const mockReq = {
    app: {
      locals: {
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
  it('should assign payment service into app.locals', () => {
    paymentMiddleware(mockReq, mockRes, mockNext);

    expect(mockRes.locals.paymentService).toBeDefined();
  });
});
