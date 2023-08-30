const initializeKafkaProducer = async (Kafka, app) => {
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

  Object.assign(app.locals, { producer });
};

const initializeKafkaConsumer = async (Kafka, app, handler) => {
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

  logger.info(`Connecting to topic ${topics.transactionStatus}`);
  await consumer.subscribe({ topic: topics.transactionStatus, fromBeginning: true });

  logger.info(`Connected to topic ${topics.transactionStatus}`, topics.transactionStatus);

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

  Object.assign(app.locals, { consumer });
};

const disconnectKafka = async (app) => {
  const { locals: { consumer, producer, logger } } = app;

  await consumer.disconnect();
  await producer.disconnect();

  logger.info('Disconnected from kafka');
};

module.exports = { initializeKafkaProducer, initializeKafkaConsumer, disconnectKafka };
