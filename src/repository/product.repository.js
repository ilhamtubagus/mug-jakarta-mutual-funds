// get products by investment manager / products category with pagination
// get product by product code
class ProductRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  async finOneByProductCode(productCode) {
    return this.collection.findOne({ productCode });
  }

  static constructProductsPipeline(investmentManager, productCategory) {
    const pipeline = [
      {
        $lookup: {
          from: 'investmentManagers',
          let: {
            investmentManager: '$investmentManager',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$investmentManagerCode',
                    '$$investmentManager',
                  ],
                },
              },
            },
          ],
          as: 'investmentManager',
        },
      },
      {
        $unwind: {
          path: '$investmentManager',
        },
      },
      {
        $project: {
          _id: 0,
          'productCategory._id': 0,
          'investmentManager._id': 0,
        },
      },
    ];
    if (productCategory !== undefined) {
      pipeline.splice(0, 0, {
        $match:
            {
              $expr: {
                $eq: [
                  '$productCategory',
                  productCategory,
                ],
              },
            },
      });
    }
    if (investmentManager !== undefined) {
      pipeline.splice(pipeline.length, 0, {
        $match:
            {
              $expr: {
                $eq: [
                  '$investmentManager.investmentManagerCode',
                  investmentManager,
                ],
              },
            },
      });
    }
    return pipeline;
  }

  async findProducts({ investmentManager, productCategory }) {
    const pipeline = ProductRepository
      .constructProductsPipeline(investmentManager, productCategory);
    this.logger.info('Find products with pipeline', JSON.stringify(pipeline));

    return this.collection
      .aggregate(pipeline)
      .toArray();
  }
}
module.exports = ProductRepository;
