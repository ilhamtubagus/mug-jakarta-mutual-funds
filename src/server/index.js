const express = require('express');
const { createLogger } = require('bunyan');
const { Kafka } = require('kafkajs');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const App = require('./app.js');
const config = require('../../config.js');
const { connectToDb, disconnectDb } = require('./db.js');
const { initializeKafkaProducer, disconnectKafka, initializeKafkaConsumer } = require('./kafka');
const kafkaConsumerHandler = require('../handler');
const serviceInitializations = require('../services/initializations');

const routes = require('../routes/index.js');

const _dbTearDown = async (expressApp) => {
  await disconnectDb(expressApp);
};

const _kafkaTearDown = async (expressApp) => {
  await disconnectKafka(expressApp);
};

const _stopServer = async (server) => async () => {
  await server.stop();
};

const logger = createLogger({ name: config.server.appName, level: config.logger.level });

const main = async () => {
  const middlewares = {
    pre: [
      bodyParser.json(),
    ],
    post: [],
  };

  const initializations = [
    async (expressApp) => {
      await connectToDb(mongodb, expressApp);
    },
    async (expressApp) => {
      await initializeKafkaProducer(Kafka, expressApp);
    },
  ];

  const deinitializations = [
    _dbTearDown,
    _kafkaTearDown,
  ];

  const consumer = async (app) => {
    await initializeKafkaConsumer(Kafka, app, kafkaConsumerHandler);
  };

  const server = new App({
    express,
    logger,
    config,
    initializations,
    deinitializations,
    middlewares,
    serviceInitializations,
    routes,
    consumer,
  });

  await server.start();

  process.on('SIGINT', await _stopServer(server));
  process.on('SIGTERM', await _stopServer(server));
};

main().then(() => logger.info('Mutual funds app')).catch((e) => logger.error(e));
