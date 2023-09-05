const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');

const router = Router();

router.get('/products/:productCode', authenticationMiddleware(), async (req, res, next) => {
  const {
    productService,
  } = req.app.locals.services;

  try {
    const { productCode } = req.params;
    const result = await productService.findProductByCode(productCode);

    res.status(201).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

router.get('/products', authenticationMiddleware(), async (req, res, next) => {
  const {
    productService,
  } = req.app.locals.services;

  try {
    const result = await productService.findProducts(req.query);

    res.status(200).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
