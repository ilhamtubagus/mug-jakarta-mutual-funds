const initializeKafkaProducer = (Kafka) => async (app) => {
  const {
    locals: {
      logger, config: {
        kafka: {
          brokers, clientId,
        },
      },
    },
  } = app;
  const kafka = new Kafka({
    clientId,
    brokers,
  });

  logger.info(`Connecting to kafka producer for brokers ${brokers}`);
  const producer = kafka.producer();
  await producer.connect();

  logger.info(`Connected to kafka producer for brokers ${brokers}`);
  Object.assign(app.locals, { producer });
};

const initializeKafkaConsumer = (Kafka, handler) => async (app) => {
  const {
    locals: {
      logger,
      config: {
        kafka: {
          groupId, topics, brokers, clientId,
        },
      },
      services,
    },
  } = app;
  const kafka = new Kafka({
    clientId,
    brokers,
  });
  const consumer = kafka.consumer({ groupId });

  logger.info('Connecting to kafka consumer');
  await consumer.connect();

  logger.info(`Subscribing to topic ${topics.transactionStatus}`);
  await consumer.subscribe({ topic: topics.transactionStatus, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({
      message,
    }) => {
      try {
        const parsedMessage = JSON.parse(message.value.toString());

        await handler({ services, logger, parsedMessage });
      } catch (e) {
        logger.error(e);
      }
    },
  });
  logger.info(`Subscribed to topic ${topics.transactionStatus}`, topics.transactionStatus);

  Object.assign(app.locals, { consumer });
};

module.exports = { initializeKafkaProducer, initializeKafkaConsumer };
