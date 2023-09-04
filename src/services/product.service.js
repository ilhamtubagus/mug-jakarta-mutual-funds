class ProductService {
  constructor({
    repository, logger,
  }) {
    this.repository = repository;
    this.logger = logger;
  }

  async findProductByCode(productCode) {
    return this.repository.findProductByCode(productCode);
  }

  async findProducts(filter) {
    return this.repository.findProducts(filter);
  }
}

module.exports = ProductService;
