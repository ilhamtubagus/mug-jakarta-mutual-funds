const jwt = require('jsonwebtoken');
const { JsonWebTokenError } = require('jsonwebtoken');
const authentication = require('./authentication.middleware');
const CustomError = require('../utils/error');

describe('authentication', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockReq = {
    log: { error: jest.fn() },
    headers: {},
    app: {
      locals: {
        config: {
          jwt: {
            secretKey: '',
            keyAlgorithm: '',
          },
        },
      },
    },
  };
  const mockRes = {
    locals: {
      auth: {},
    },
  };
  const mockNext = jest.fn();

  describe('#_extractToken', () => {
    it('should throw custom error authorization headers is required when undefined', () => {
      const error = new CustomError('Authorization headers is required', 401);

      authentication()(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should throw custom error authorization headers is required when authorization is not bearer', () => {
      const error = new CustomError('Wrong authorization headers format', 401);
      mockReq.headers.authorization = 'notBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTE4OTY5MDcsImF1ZCI6IkNVU1RPTUVSIn0.KPtQWwkyp5sdLSrUoK0GDxC0DsdKERIL0Rpkt-h8XHo';

      authentication()(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should throw custom error authorization headers is required when authorization token is not provided', () => {
      const error = new CustomError('Wrong authorization headers format', 401);
      mockReq.headers.authorization = 'bearer';

      authentication()(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('#_verifyToken', () => {
    it('should throw custom error when token jwt token error', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTE4OTY5MDcsImF1ZCI6IkNVU1RPTUVSIn0.KPtQWwkyp5sdLSrUoK0GDxC0DsdKERIL0Rpkt-h8XHo';
      mockReq.headers.authorization = `bearer ${mockToken}`;
      const mockJwtError = new JsonWebTokenError('jwt malformed');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw mockJwtError;
      });
      const error = new CustomError(mockJwtError.message, 401);

      authentication()(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should throw custom error unauthorized when token aud is not match', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTE4OTY5MDcsImF1ZCI6IkNVU1RPTUVSIn0.KPtQWwkyp5sdLSrUoK0GDxC0DsdKERIL0Rpkt-h8XHo';
      mockReq.headers.authorization = `bearer ${mockToken}`;
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        cif: '123',
        aud: 'ADMIN',
      });

      const error = new CustomError('Unauthorized access', 401);

      authentication()(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should throw custom error unauthorized when token aud is not match with provided value', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTE4OTY5MDcsImF1ZCI6IkNVU1RPTUVSIn0.KPtQWwkyp5sdLSrUoK0GDxC0DsdKERIL0Rpkt-h8XHo';
      mockReq.headers.authorization = `bearer ${mockToken}`;
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        cif: '123',
        aud: 'ADMIN',
      });

      const error = new CustomError('Unauthorized access', 401);

      authentication('CUSTOMER')(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should set user credentials into res.locals.auth', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTE4OTY5MDcsImF1ZCI6IkNVU1RPTUVSIn0.KPtQWwkyp5sdLSrUoK0GDxC0DsdKERIL0Rpkt-h8XHo';
      mockReq.headers.authorization = `bearer ${mockToken}`;
      jest.spyOn(jwt, 'verify').mockReturnValueOnce({
        cif: '123',
        aud: 'CUSTOMER',
      });

      authentication()(mockReq, mockRes, mockNext);

      expect(mockRes.locals.auth).toStrictEqual({
        user: {
          cif: '123',
          role: 'CUSTOMER',
        },
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
