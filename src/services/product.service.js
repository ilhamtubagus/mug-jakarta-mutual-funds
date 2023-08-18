class ProductService {
  constructor({
    repository, logger,
  }) {
    this.repository = repository;
    this.logger = logger;
  }

  async finOneByProductCode(productCode) {
    return this.repository.finOneByProductCode(productCode);
  }

  async findProducts(filter) {
    return this.repository.findProducts(filter);
  }
}

module.exports = ProductService;
