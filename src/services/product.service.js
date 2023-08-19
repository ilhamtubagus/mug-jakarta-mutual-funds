class ProductService {
  constructor({
    repository, logger,
  }) {
    this.repository = repository;
    this.logger = logger;
  }

  async findOneByProductCode(productCode) {
    return this.repository.findOneByProductCode(productCode);
  }

  async findProducts(filter) {
    return this.repository.findProducts(filter);
  }
}

module.exports = ProductService;
