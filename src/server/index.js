import express from 'express';
import { pinoHttp } from 'pino-http';
import mongodb from 'mongodb';
import bodyParser from 'body-parser';
import App from './app.js';
import config from '../../config.js';
import { connectToDb, disconnectDb } from './db.js';
import routes from '../routes/index.js';

const _dbTearDown = async (expressApp) => {
  await disconnectDb(expressApp);
};

const _stopServer = async (server) => async () => {
  await server.stop();
};

const main = async () => {
  const middlewares = {
    pre: [bodyParser.json()],
    post: [],
  };

  const initializations = [
    async (expressApp) => {
      await connectToDb(mongodb, expressApp);
    },
  ];

  const teardownServices = [
    _dbTearDown,
  ];

  const server = new App({
    express,
    logger: pinoHttp(),
    config,
    initializations,
    teardownServices,
    middlewares,
    routes,
  });

  await server.start();

  process.on('SIGINT', await _stopServer(server));
  process.on('SIGTERM', await _stopServer(server));
};

main().then(() => pinoHttp().logger.info('Server starting'));
