import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: { port: process.env.PORT },
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

};

export default config;
