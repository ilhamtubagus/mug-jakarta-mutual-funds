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

  describe('#get', () => {
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
});
