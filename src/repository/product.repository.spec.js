const { MongoClient } = require('mongodb');
const { ProductRepository } = require('./index');
const { products, investmentManagers, navs } = require('../fixtures');

describe('ProductRepository', () => {
  let connection;
  let productsCollection;
  let productRepository;
  let navsCollection;
  let mockProducts;
  let mockNavs;
  let mockInvestmentManagers;
  let investmentManagersCollection;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    productsCollection = connection.db().collection('products');
    investmentManagersCollection = connection.db().collection('investmentManagers');
    navsCollection = connection.db().collection('navs');

    productRepository = new ProductRepository({
      collection: productsCollection,
      logger: { info: jest.fn() },
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    mockProducts = [...products];
    mockInvestmentManagers = [...investmentManagers];
    mockNavs = [...navs];

    await productsCollection.insertMany(mockProducts);
    await investmentManagersCollection.insertMany(mockInvestmentManagers);
    await navsCollection.insertMany(mockNavs);
  });

  afterEach(async () => {
    await connection.db().dropCollection('products');
    await connection.db().dropCollection('investmentManagers');
    await connection.db().dropCollection('navs');
  });

  describe('#findOneByProductCode', () => {
    it('should return empty object when product was not found', async () => {
      const result = await productRepository.findOneByProductCode('SCHPUZ');

      expect(result).toStrictEqual({});
    });

    it('should return the product when product was found', async () => {
      const expectedProduct = { ...products[0] };
      expectedProduct.investmentManager = { ...investmentManagers[0] };
      const navsProduct = navs.filter((n) => n.productCode === 'SCHPU');
      navsProduct.sort((a, b) => b.createdAt - a.createdAt);
      const [nav] = navsProduct;
      expectedProduct.nav = nav;
      delete expectedProduct._id;
      delete expectedProduct.investmentManager._id;
      delete expectedProduct.nav._id;
      delete expectedProduct.nav.productCode;

      const result = await productRepository.findOneByProductCode('SCHPU');

      expect(result).toStrictEqual(expectedProduct);
    });

    it('should return product without nav when nav for the selected product is not exists', async () => {
      await navsCollection.deleteMany({ productCode: 'SCHPU' });
      const expectedProduct = { ...products[0] };
      expectedProduct.investmentManager = { ...investmentManagers[0] };
      delete expectedProduct._id;
      delete expectedProduct.investmentManager._id;

      const result = await productRepository.findOneByProductCode('SCHPU');

      expect(result).toStrictEqual(expectedProduct);
    });
  });

  describe('#findProducts', () => {
    it('should return all products when filter is empty', async () => {
      const expectedProducts = [...mockProducts].map((p) => {
        const { _id, investmentManager: investmentManagerCode, ...product } = p;
        const investmentManager = mockInvestmentManagers
          .find((i) => i.investmentManagerCode === investmentManagerCode);
        delete investmentManager._id;
        return {
          ...product,
          investmentManager,
        };
      });
      const result = await
      productRepository.findProducts({ investmentManager: undefined, productCategory: undefined });

      expect(result).toStrictEqual(expectedProducts);
    });

    it('should return product with selected product category', async () => {
      const expectedProducts = [...mockProducts].filter((p) => p.productCategory === 'money market').map((p) => {
        const { _id, investmentManager: investmentManagerCode, ...product } = p;
        const investmentManager = mockInvestmentManagers
          .find((i) => i.investmentManagerCode === investmentManagerCode);
        delete investmentManager._id;
        return {
          ...product,
          investmentManager,
        };
      });
      const result = await
      productRepository.findProducts({ investmentManager: undefined, productCategory: 'money market' });

      expect(result).toStrictEqual(expectedProducts);
    });

    it('should return product with selected investment manager', async () => {
      const expectedProducts = [...mockProducts].filter((p) => p.investmentManager === 'SCH').map((p) => {
        const { _id, investmentManager: investmentManagerCode, ...product } = p;
        const investmentManager = mockInvestmentManagers
          .find((i) => i.investmentManagerCode === investmentManagerCode);
        delete investmentManager._id;
        return {
          ...product,
          investmentManager,
        };
      });
      const result = await
      productRepository.findProducts({ investmentManager: 'SCH', productCategory: undefined });

      expect(result).toStrictEqual(expectedProducts);
    });

    it('should return product with selected investment manager and product category', async () => {
      const expectedProducts = [...mockProducts].filter((p) => p.investmentManager === 'SCH' && p.productCategory === 'money market').map((p) => {
        const { _id, investmentManager: investmentManagerCode, ...product } = p;
        const investmentManager = mockInvestmentManagers
          .find((i) => i.investmentManagerCode === investmentManagerCode);
        delete investmentManager._id;
        return {
          ...product,
          investmentManager,
        };
      });
      const result = await
      productRepository.findProducts({ investmentManager: 'SCH', productCategory: 'money market' });

      expect(result).toStrictEqual(expectedProducts);
    });

    it('should return empty when product with selected investment manager and product category is not exist', async () => {
      const result = await
      productRepository.findProducts({ investmentManager: 'SCHZ', productCategory: undefined });

      expect(result).toStrictEqual([]);
    });
  });
});
