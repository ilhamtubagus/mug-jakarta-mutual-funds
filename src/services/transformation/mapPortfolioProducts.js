const mapPortfolioProduct = (ownedProducts, productData) => {
  if (!ownedProducts) {
    return [productData];
  }

  const matchedProduct = ownedProducts.find(
    (product) => product.productCode === productData.productCode,
  );

  if (!matchedProduct) {
    return [...ownedProducts, productData];
  }

  return ownedProducts.reduce((prevProduct, product) => {
    const { productCode, units, capitalInvestment } = product;
    const {
      productCode: transactionProductCode,
      units: transactionUnit,
      capitalInvestment: transactionAmount,
    } = productData;
    let updatedProduct = { productCode, units, capitalInvestment };

    if (productCode === transactionProductCode) {
      updatedProduct = {
        productCode,
        units: units + transactionUnit,
        capitalInvestment: capitalInvestment + transactionAmount,
      };
    }
    return [
      ...prevProduct,
      updatedProduct,
    ];
  }, []);
};

module.exports = { mapPortfolioProduct };
