const dotenv = require('dotenv');

dotenv.config();

const config = {
  server: { port: process.env.PORT, appName: process.env.APP_NAME },
  db: {
    password: process.env.DB_PASSWORD,
    username: process.env.DB_USERNAME,
    instances: process.env.DB_INSTANCES,
    options: process.env.DB_OPTIONS,
    name: process.env.DB_NAME,
  },
  logger: {
    level: process.env.LOG_LEVEL,
  },
  jwt: {
    secretKey: process.env.SECRET_KEY,
    keyAlgorithm: process.env.KEY_ALGORITHM || 'HS256',
    expiry: process.env.JWT_EXPIRY || '1m',
  },
  encryption: {
    secret: process.env.ENC_SECRET || 10,
  },
  paymentExpiration: process.env.PAYMENT_EXPIRATION || 1,
};

module.exports = config;
