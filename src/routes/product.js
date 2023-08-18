const { Router } = require('express');

const router = Router();

router.get('/products/:productCode', async (req, res, next) => {
  const {
    productService,
  } = res.locals;

  try {
    const { productCode } = req.params;
    const result = await productService.finOneByProductCode(productCode);

    res.status(201).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

router.get('/products', async (req, res, next) => {
  const {
    productService,
  } = res.locals;

  try {
    const result = await productService.findProducts(req.query);

    res.status(200).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
