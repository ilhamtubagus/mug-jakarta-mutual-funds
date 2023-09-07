const { ProductService } = require('../index');

const productInitializations = (app) => {
  const { atlasFunctions, logger } = app.locals;
  const repository = atlasFunctions;
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
