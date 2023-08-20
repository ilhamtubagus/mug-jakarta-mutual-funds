const { MongoClient } = require('mongodb');
const PortfolioRepository = require('./portfolio.repository');
const { portfolios: mockPortfolios } = require('../fixtures');

describe('PortfolioRepository', () => {
  let connection;
  let collection;
  let portfolioRepository;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    collection = await connection.db().collection('portfolio');
    portfolioRepository = new PortfolioRepository({
      collection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('#findByCif', () => {
    beforeAll((async () => {
      await collection.insertMany(mockPortfolios);
    }));

    afterAll(async () => {
      await collection.drop();
    });

    it('should return portfolios for given cif', async () => {
      const expectedResult = mockPortfolios;

      const portfolios = await portfolioRepository.findByCif(mockPortfolios[0].cif);

      expect(portfolios).toStrictEqual(expectedResult);
    });

    it('should return empty array when portfolio for given cif is not exist', async () => {
      const expectedResult = [];

      const portfolios = await portfolioRepository.findByCif('');

      expect(portfolios).toStrictEqual(expectedResult);
    });
  });

  describe('#create', () => {
    it('should return the newly created account', async () => {
      const expectedPortfolio = mockPortfolios[0];

      const { acknowledged } = await portfolioRepository.create(mockPortfolios[0]);

      expect(acknowledged).toBe(true);
      expect(async () => collection.findOne({ cif: expectedPortfolio.cif })).not.toBeNull();
    });
  });
});
