const jwt = require('jsonwebtoken');
const CustomError = require('../utils/error.js');

const Constants = require('../constants.js');

const { JsonWebTokenError, TokenExpiredError } = jwt;

const { TOKEN_AUDIENCE: { CUSTOMER } } = Constants;

const _extractToken = (req) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new CustomError('Authorization headers is required', 401);
  }

  const authorizationPayload = authorization.split(/\s+/);

  if (authorizationPayload[0] !== 'bearer' || authorizationPayload.length !== 2) {
    throw new CustomError('Wrong authorization headers format', 401);
  }

  return authorizationPayload[1];
};

const _verifyToken = (token, audience, { secretKey, keyAlgorithm }) => {
  const decodedToken = jwt.verify(token, secretKey, { algorithm: keyAlgorithm });

  if (decodedToken.aud !== audience) {
    throw new CustomError('Unauthorized access', 401);
  }
  return decodedToken;
};

const authenticate = (audience = CUSTOMER) => (req, res, next) => {
  const { config: { jwt: jwtConfig }, logger } = req.app.locals;
  try {
    const token = _extractToken(req);
    const { userId, aud: role } = _verifyToken(token, audience, jwtConfig);
    const user = { userId, role };
    res.locals.auth = { user };
    return next();
  } catch (e) {
    logger.error(e);
    let error = e;

    if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
      error = new CustomError(error.message, 401);
    }
    return next(error);
  }
};

module.exports = authenticate;
