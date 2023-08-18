const { ProductRepository } = require('../repository');
const { ProductService } = require('../services');

const productMiddleware = (req, res, next) => {
  const { db, logger } = req.app.locals;
  const collection = db.collection('products');
  const repository = new ProductRepository({ collection, logger });
  const productService = new ProductService({
    repository, logger,
  });

  Object.assign(res.locals, { productService });

  return next();
};
module.exports = productMiddleware;
