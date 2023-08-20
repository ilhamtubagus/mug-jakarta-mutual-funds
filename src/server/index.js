const express = require('express');
const { createLogger } = require('bunyan');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const App = require('./app.js');
const config = require('../../config.js');
const { connectToDb, disconnectDb } = require('./db.js');
const routes = require('../routes/index.js');
const { accountMiddleware, productMiddleware } = require('../middlewares');

const _dbTearDown = async (expressApp) => {
  await disconnectDb(expressApp);
};

const _stopServer = async (server) => async () => {
  await server.stop();
};

const logger = createLogger({ name: config.server.appName, level: config.logger.level });

const main = async () => {
  const middlewares = {
    pre: [bodyParser.json(), accountMiddleware, productMiddleware],
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
    logger,
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

main().then(() => logger.info('Mutual funds app')).catch((e) => logger.error(e));
