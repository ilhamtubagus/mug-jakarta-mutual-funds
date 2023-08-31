const { ProductRepository } = require('../../repository');
const { ProductService } = require('../index');

const productInitializations = (app) => {
  const { db, logger } = app.locals;
  const collection = db.collection('products');
  const repository = new ProductRepository({ collection, logger });
  const productService = new ProductService({
    repository, logger,
  });

  Object.assign(app.locals, {
    services: {
      ...app.locals.services,
      productService,
    },
  });
};
module.exports = productInitializations;
