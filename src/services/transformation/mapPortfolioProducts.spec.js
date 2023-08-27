const { mapPortfolioProduct } = require('./index');

describe('MapPortfolioProducts', () => {
  const mockOwnedProducts = [
    {
      productCode: 'SCHP',
      units: 100,
      capitalInvestment: 100000,
    },
    {
      productCode: 'SCH',
      units: 100,
      capitalInvestment: 100000,
    },
  ];
  const mockProductData = {
    productCode: 'SCH',
    units: 10,
    capitalInvestment: 10000,
  };

  describe('#mapPortfolioProduct', () => {
    it('should return given product data when given no owned product', async () => {
      const expectedResult = [mockProductData];

      const result = mapPortfolioProduct(undefined, mockProductData);

      expect(result).toStrictEqual(expectedResult);
    });

    it('should return added owned product with product data', async () => {
      const expectedResult = [...[mockOwnedProducts[0]], mockProductData];

      const result = mapPortfolioProduct([mockOwnedProducts[0]], mockProductData);

      expect(result).toStrictEqual(expectedResult);
    });

    it('should return enriched owned product with product data', async () => {
      const expectedProductData = [
        {
          productCode: 'SCHP',
          units: 100,
          capitalInvestment: 100000,
        },
        {
          productCode: 'SCH',
          units: 110,
          capitalInvestment: 110000,
        },
      ];

      const result = mapPortfolioProduct(mockOwnedProducts, mockProductData);

      expect(result).toStrictEqual(expectedProductData);
    });
  });
});
