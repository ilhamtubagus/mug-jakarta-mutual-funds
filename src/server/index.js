const express = require('express');
const { createLogger } = require('bunyan');
const { Kafka } = require('kafkajs');
const bodyParser = require('body-parser');
const Realm = require('realm-web');
const App = require('./app.js');
const config = require('../../config.js');
const { initializeKafkaProducer, initializeKafkaConsumer } = require('./initializations/kafka');
const { initializeAtlasFunctions } = require('./initializations/realm');
const kafkaConsumerHandler = require('../handler');
const serviceInitializations = require('../services/initializations');

const routes = require('../routes/index.js');

const _stopServer = (server) => async () => {
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

  const initializations = [initializeAtlasFunctions(Realm), initializeKafkaProducer(Kafka)];

  const consumer = initializeKafkaConsumer(Kafka, kafkaConsumerHandler);

  const server = new App({
    express,
    logger,
    config,
    initializations,
    middlewares,
    serviceInitializations,
    routes,
    consumer,
  });

  try {
    await server.start();
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, _stopServer(server));
  });
};

main();
