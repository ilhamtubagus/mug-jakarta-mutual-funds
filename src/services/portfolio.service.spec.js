const mockDate = require('mockdate');
const { portfolios: mockPortfolios } = require('../fixtures');
const PortfolioService = require('./portfolio.service');

describe('PortfolioService', () => {
  const now = new Date();
  let portfolioService;
  let mockRepository;
  let mockLogger;

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
  });

  afterEach(() => {
    mockDate.reset();
    jest.clearAllMocks();
  });

  describe('#get', () => {
    it('should return found portfolio from repository', async () => {
      mockRepository.findByCif.mockResolvedValue(mockPortfolios[0]);
      const expectedResult = mockPortfolios[0];
      const user = {
        cif: mockPortfolios[0].cif,
      };

      const result = await portfolioService.get(user);

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
      mockRepository.findByCif.mockResolvedValue([mockPortfolios[0]]);
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
