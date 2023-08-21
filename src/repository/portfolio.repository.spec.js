const { MongoClient } = require('mongodb');
const PortfolioRepository = require('./portfolio.repository');
const { portfolios, products, navs } = require('../fixtures');

describe('PortfolioRepository', () => {
  let connection;
  let portfolioCollection;
  let productCollection;
  let navsCollection;
  let portfolioRepository;
  let mockPortfolios;
  let mockNavs;
  let mockProducts;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    navsCollection = await connection.db().collection('navs');
    productCollection = await connection.db().collection('products');
    portfolioCollection = await connection.db().collection('portfolio');
    portfolioRepository = new PortfolioRepository({
      collection: portfolioCollection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('#findByCif', () => {
    beforeEach((async () => {
      mockNavs = [...navs];
      mockPortfolios = [...portfolios];
      mockProducts = [...products];

      await portfolioCollection.insertMany(mockPortfolios);
      await navsCollection.insertMany(mockNavs);
      await productCollection.insertMany(mockProducts);
    }));

    afterEach(async () => {
      await portfolioCollection.drop();
      await navsCollection.drop();
      await productCollection.drop();
    });

    it('should return portfolios for given cif', async () => {
      const expectedResult = [
        {
          cif: 'HRSTBDHICE',
          portfolioCode: '001',
          name: 'Coba 1',
          createdAt: new Date('2023-08-10'),
          modifiedAt: new Date('2023-08-19'),
          products: [
            {
              productCode: 'SCHE',
              units: 100,
              currentNav: 1900,
              name: 'Schroder Dana Equity',
              productCategory: 'equity',
              imageUrl: '',
              sellFee: 0.2,
              buyFee: 0.2,
              capitalInvestment: 10000,
              tax: 0,
              navDate: new Date('2023-08-23'),
            },
          ],
        },
      ];

      const result = await portfolioRepository.findByCif(mockPortfolios[0].cif);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should return empty array when portfolio for given cif is not exist', async () => {
      const expectedResult = [];

      const result = await portfolioRepository.findByCif('');

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('#create', () => {
    it('should return the newly created account', async () => {
      const mockPortfolio = mockPortfolios[0];
      delete mockPortfolio._id;
      const expectedPortfolio = mockPortfolios[0];

      const { acknowledged } = await portfolioRepository.create(mockPortfolios[0]);

      expect(acknowledged).toBe(true);
      expect(
        async () => portfolioCollection.findOne({ cif: expectedPortfolio.cif }),
      ).not.toBeNull();
    });
  });
});
