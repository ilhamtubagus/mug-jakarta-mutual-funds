const mapPortfolioProduct = (ownedProducts, productData) => {
  if (!ownedProducts) {
    return [productData];
  }

  const matchedProduct = ownedProducts.find(
    (product) => product.productCode === productData.productCode,
  );

  if (!matchedProduct) {
    const newProduct = [...ownedProducts, productData];
    return newProduct;
  }

  const updatedProduct = ownedProducts.reduce((prevProduct, product) => {
    const { productCode, units, capitalInvestment } = product;
    const {
      productCode: purchaseProductCode,
      units: purchaseUnits,
      capitalInvestment: purchaseInvestment,
    } = productData;
    let increasedProduct = { productCode, units, capitalInvestment };

    if (productCode === purchaseProductCode) {
      increasedProduct = {
        productCode,
        units: units + purchaseUnits,
        capitalInvestment: capitalInvestment + purchaseInvestment,
      };
    }
    return [
      ...prevProduct,
      increasedProduct,
    ];
  }, []);

  return updatedProduct;
};

module.exports = { mapPortfolioProduct };
