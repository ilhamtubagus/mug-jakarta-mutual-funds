const mockDate = require('mockdate');
const PortfolioService = require('./portfolio.service');

describe('PortfolioService', () => {
  const now = new Date();
  let portfolioService;
  let mockRepository;
  let mockLogger;
  let mockPortfolios;

  beforeEach(() => {
    mockRepository = {
      findByCif: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
    };
    portfolioService = new PortfolioService({
      repository: mockRepository,
      logger: mockLogger,
    });
    mockDate.set(now);
    mockPortfolios = [
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
  });

  afterEach(() => {
    mockDate.reset();
    jest.clearAllMocks();
  });

  describe('#find', () => {
    it('should return found portfolio from repository', async () => {
      mockRepository.findByCif.mockResolvedValue(mockPortfolios);
      const expectedResult = [
        {
          ...mockPortfolios[0],
          products: mockPortfolios[0].products.map((product) => {
            const currentInvestmentValue = product.currentNav * product.units;
            const unrealizedGainLoss = currentInvestmentValue - product.capitalInvestment;
            const
              percentagePotentialReturn = (unrealizedGainLoss / product.capitalInvestment) * 100;
            return {
              ...product,
              currentInvestmentValue,
              unrealizedGainLoss,
              percentagePotentialReturn,
            };
          }),
        },
      ];
      const user = {
        cif: mockPortfolios[0].cif,
      };

      const result = await portfolioService.getPortfolios(user);

      await expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('#create', () => {
    it('should add new portfolio into repository', async () => {
      mockRepository.findByCif.mockResolvedValue([]);
      const user = {
        cif: mockPortfolios[0].cif,
      };
      const portfolioName = 'coba 1';
      const expectedData = {
        cif: mockPortfolios[0].cif,
        portfolioCode: '001',
        name: portfolioName,
        products: [],
        createdAt: now,
        modifiedAt: now,
      };

      await portfolioService.create(user, portfolioName);

      expect(mockRepository.create).toBeCalledWith(expectedData);
    });

    it('should increment portfolioCode when user already has a portfolio', async () => {
      mockRepository.findByCif.mockResolvedValue(mockPortfolios);
      const user = {
        cif: mockPortfolios[0].cif,
      };
      const portfolioName = 'coba 2';
      const expectedData = {
        cif: mockPortfolios[0].cif,
        portfolioCode: '002',
        name: portfolioName,
        products: [],
        createdAt: now,
        modifiedAt: now,
      };

      await portfolioService.create(user, portfolioName);

      expect(mockRepository.create).toBeCalledWith(expectedData);
    });
  });

  describe('#updateOwnedProduct', () => {
    it('should save updated portfolio to repository', async () => {
      mockRepository.findOne.mockResolvedValue(mockPortfolios[0]);
      const { cif, portfolioCode } = mockPortfolios[0];
      const productData = {
        productCode: 'SCHE',
        units: 10,
        capitalInvestment: 1000,
      };
      const updatedProduct = [{
        productCode: 'SCHE',
        units: 110,
        capitalInvestment: 11000,

      }];
      await portfolioService.updateOwnedProduct(cif, portfolioCode, productData);

      expect(mockRepository.updateOne)
        .toBeCalledWith(...[cif, portfolioCode, updatedProduct]);
    });
  });

  describe('#findOne', () => {
    it('should return portfolio for given user', async () => {
      mockRepository.findOne.mockResolvedValue(mockPortfolios[0]);
      const { cif, portfolioCode } = mockPortfolios[0];

      await portfolioService.findOne(cif, portfolioCode);

      expect(mockRepository.findOne).toBeCalledWith(cif, portfolioCode);
    });
  });
});
