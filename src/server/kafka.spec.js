const { initializeKafkaProducer, disconnectKafka } = require('./kafka');

describe('kafka', () => {
  const connect = jest.fn();
  const disconnect = jest.fn();
  const producer = jest.fn().mockReturnValue({ connect, disconnect });
  const consumer = jest.fn().mockReturnValue({ connect, disconnect });
  const mockKafka = jest.fn().mockReturnValue({ producer, consumer });
  producer.connect = connect;
  producer.disconnect = disconnect;
  consumer.connect = connect;
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
        },
      },
      consumer,
      producer,
    },
  };

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
});
