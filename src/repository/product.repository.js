class ProductRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  static constructGetProductByProductCodePipeline(productCode) {
    return [
      {
        $match: {
          productCode: {
            $eq: productCode,
          },
        },
      },
      {
        $lookup: {
          from: 'investmentManagers',
          localField: 'investmentManager',
          foreignField: 'investmentManagerCode',
          as: 'investmentManager',
        },
      },
      {
        $lookup: {
          from: 'navs',
          let: {
            productCode: '$productCode',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$productCode',
                    '$$productCode',
                  ],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: 'nav',
        },
      },
      {
        $addFields: {
          nav: {
            $first: '$nav',
          },
          investmentManager: {
            $first: '$investmentManager',
          },
        },
      },
      {
        $project: {
          _id: 0,
          'investmentManager._id': 0,
          'nav._id': 0,
          'nav.productCode': 0,
        },
      },
    ];
  }

  async findOneByProductCode(productCode) {
    const pipeline = ProductRepository.constructGetProductByProductCodePipeline(productCode);
    this.logger.info('Find product by code with pipeline', JSON.stringify(pipeline));

    const result = await this.collection
      .aggregate(pipeline)
      .toArray();

    if (result.length === 0) return null;
    return result[0];
  }

  static constructGetProductsPipeline(investmentManager, productCategory) {
    const pipeline = [
      {
        $lookup: {
          from: 'investmentManagers',
          localField: 'investmentManager',
          foreignField: 'investmentManagerCode',
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
              productCategory: { $eq: productCategory },
            },
      });
    }
    if (investmentManager !== undefined) {
      pipeline.splice(pipeline.length, 0, {
        $match:
            {
              'investmentManager.investmentManagerCode': { $eq: investmentManager },
            },
      });
    }
    return pipeline;
  }

  async findProducts({ investmentManager, productCategory }) {
    const pipeline = ProductRepository
      .constructGetProductsPipeline(investmentManager, productCategory);
    this.logger.info('Find products with pipeline', JSON.stringify(pipeline));

    return this.collection
      .aggregate(pipeline)
      .toArray();
  }
}
module.exports = ProductRepository;
