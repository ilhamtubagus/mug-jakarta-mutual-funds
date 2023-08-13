const { connectToDb, disconnectDb } = require('./db');

describe('db', () => {
  let mockApp;
  let mockMongodb;

  beforeEach(() => {
    mockApp = {
      locals: {
        logger: { info: jest.fn() },
        config: {
          db: {
            username: 'mf', password: 'mf', instances: '127.0.0:1707', options: 'wtimeoutMS=60000', name: 'mf',
          },
        },
      },
    };
    mockMongodb = {
      MongoClient: {
        connect: jest.fn(),
        close: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#connectDb', () => {
    it('should connect without options if its not provided', async () => {
      delete mockApp.locals.config.db.options;
      const mockMongoClient = {
        db: jest.fn().mockImplementation((v) => v),
      };
      mockMongodb.MongoClient.connect.mockResolvedValueOnce(mockMongoClient);

      await connectToDb(mockMongodb, mockApp);

      expect(mockApp.locals.logger.info).toHaveBeenCalledTimes(1);
      expect(mockApp.locals.db).toBe('mf');
      expect(mockApp.locals.mongoClient).toBe(mockMongoClient);
    });

    it('should set mongoClient and db to app.locals then return mongoClient', async () => {
      const mockMongoClient = {
        db: jest.fn().mockImplementation((v) => v),
      };
      mockMongodb.MongoClient.connect.mockResolvedValueOnce(mockMongoClient);

      await connectToDb(mockMongodb, mockApp);

      expect(mockApp.locals.logger.info).toHaveBeenCalledTimes(1);
      expect(mockApp.locals.db).toBe('mf');
      expect(mockApp.locals.mongoClient).toBe(mockMongoClient);
    });
  });

  describe('#disconnectDb', () => {
    it('should ', async () => {
      mockApp.locals.mongoClient = {
        close: jest.fn(),
      };
      mockMongodb.MongoClient.close.mockResolvedValueOnce({});

      await disconnectDb(mockApp);

      expect(mockApp.locals.logger.info).toHaveBeenCalledTimes(1);
      expect(mockApp.locals.mongoClient.close).toHaveBeenCalledTimes(1);
    });
  });
});
