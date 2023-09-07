const { ProductService } = require('./index');

describe('ProductService', () => {
  let productService;
  let mockRepository;
  let mockLogger;

  beforeEach(() => {
    mockRepository = {
      findProductByCode: jest.fn(),
      findProducts: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
    };

    productService = new ProductService({ logger: mockLogger, repository: mockRepository });
  });

  describe('#finOneByProductCode', () => {
    it('should invoke findProductByCode', async () => {
      await productService.findProductByCode('SCH');

      expect(mockRepository.findProductByCode).toBeCalledWith('SCH');
    });
  });

  describe('#findProducts', () => {
    it('should invoke findProducts', async () => {
      const filter = { investmentManager: 'SCH', productCategory: undefined };

      await productService.findProducts(filter);

      expect(mockRepository.findProducts).toBeCalledWith(filter);
    });
  });
});
