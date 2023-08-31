const { initializeKafkaProducer, disconnectKafka, initializeKafkaConsumer } = require('./kafka');

describe('kafka', () => {
  const connect = jest.fn();
  const subscribe = jest.fn();
  const run = jest.fn();
  const disconnect = jest.fn();
  const producer = jest.fn().mockReturnValue({ connect, disconnect });
  const consumer = jest.fn().mockReturnValue({
    connect, disconnect, subscribe, run,
  });
  const mockKafka = jest.fn().mockReturnValue({ producer, consumer });
  producer.connect = connect;
  producer.disconnect = disconnect;
  consumer.connect = connect;
  consumer.subscribe = subscribe;
  consumer.run = run;
  consumer.disconnect = disconnect;
  mockKafka.producer = producer;
  mockKafka.consumer = consumer;
  const mockApp = {
    locals: {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
      config: {
        kafka: {
          brokers: 'localhost:9092',
          clientId: 'MF',
          groupId: 'MF',
          topics: {
            transactionStatus: 'MF_TRANSACTION_STATUS',
          },
        },
      },
      consumer,
      producer,
      services: {},
    },
  };
  const mockHandler = jest.fn();

  describe('#initializeKafkaProducer', () => {
    it('should assign producer into app.locals', async () => {
      await initializeKafkaProducer(mockKafka, mockApp);

      expect(mockKafka.producer).toBeCalled();
      expect(mockApp.locals.producer).toBeDefined();
    });
  });

  describe('#disconnectKafka', () => {
    it('should assign producer into app.locals', async () => {
      await disconnectKafka(mockApp);

      expect(mockKafka.producer.disconnect).toBeCalled();
      expect(mockKafka.consumer.disconnect).toBeCalled();
    });
  });

  describe('#initializeKafkaConsumer', () => {
    it('should instantiate kafka consumer, connect, subscribe, and run', async () => {
      await initializeKafkaConsumer(mockKafka, mockApp, mockHandler);

      expect(mockKafka.consumer).toBeCalledWith({ groupId: mockApp.locals.config.kafka.groupId });
      expect(mockKafka.consumer.connect).toBeCalled();
      expect(mockKafka.consumer.subscribe)
        .toBeCalledWith({
          topic: mockApp.locals.config.kafka.topics.transactionStatus,
          fromBeginning: true,
        });
      expect(mockKafka.consumer.run).toBeCalled();
    });

    it('should parsed message when each message handler invoked', async () => {
      await initializeKafkaConsumer(mockKafka, mockApp, mockHandler);
      const eachMessageHandler = mockKafka.consumer.run.mock.calls[0][0].eachMessage;
      const mockMessage = {
        value: Buffer.from(JSON.stringify({ test: 'data' })),
      };
      await eachMessageHandler({ message: mockMessage });

      expect(mockHandler).toHaveBeenCalledWith({
        services: mockApp.locals.services,
        logger: mockApp.locals.logger,
        parsedMessage: { test: 'data' },
      });
    });

    it('should invoke logger when each message handler throw error', async () => {
      await initializeKafkaConsumer(mockKafka, mockApp, mockHandler);
      const eachMessageHandler = mockKafka.consumer.run.mock.calls[0][0].eachMessage;
      const mockMessage = {
        value: 'invalid-json',
      };
      await eachMessageHandler({ message: mockMessage });

      expect(mockApp.locals.logger.error).toBeCalledTimes(1);
    });
  });
});
