class PortfolioRepository {
  constructor({ collection, logger }) {
    this.collection = collection;
    this.logger = logger;
  }

  static getFindPortfolioPipeline(cif) {
    return [
      {
        $match: {
          cif,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productCode',
          foreignField: 'productCode',
          as: 'fetchedProducts',
          pipeline: [
            {
              $lookup: {
                from: 'navs',
                localField: 'productCode',
                foreignField: 'productCode',
                pipeline: [
                  {
                    $sort: {
                      createdAt: -1,
                    },
                  },
                  {
                    $limit: 1,
                  },
                ],
                as: 'currentNav',
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
              $addFields: {
                currentNav: {
                  $first: '$currentNav.currentValue',
                },
                navDate: {
                  $first: '$currentNav.createdAt',
                },
                investmentManager: {
                  $first: '$investmentManager',
                },
              },
            },
          ],
        },
      },
      {
        $unset: [
          '_id',
          'fetchedProducts._id',
          'fetchedProducts.createdAt',
          'fetchedProducts.investmentManager._id',
        ],
      },
      {
        $project: {
          cif: 1,
          portfolioCode: 1,
          name: 1,
          createdAt: 1,
          modifiedAt: 1,
          investmentManager: 1,
          products: {
            $map: {
              input: '$products',
              in: {
                $mergeObjects: [
                  {
                    $arrayElemAt: [
                      '$$ROOT.products',
                      {
                        $indexOfArray: [
                          '$fetchedProducts.productCode',
                          '$$this.productCode',
                        ],
                      },
                    ],
                  },
                  {
                    $arrayElemAt: [
                      '$fetchedProducts',
                      {
                        $indexOfArray: [
                          '$fetchedProducts.productCode',
                          '$$this.productCode',
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ];
  }

  async findByCif(cif) {
    this.logger.info(`Find portfolio by cif: ${cif}`);

    const pipeline = PortfolioRepository.getFindPortfolioPipeline(cif);

    return this.collection.aggregate(pipeline).toArray();
  }

  async create(portfolioData) {
    this.logger.info(`Creating new portfolio for cif: ${portfolioData.cif}`);

    return this.collection.insertOne(portfolioData);
  }

  async findOne(cif, portfolioCode) {
    const filter = {
      cif,
      portfolioCode,
    };

    return this.collection.findOne(filter);
  }

  async updateOne(cif, portfolioCode, updatedProducts) {
    console.log(updatedProducts);
    const filter = {
      cif,
      portfolioCode,
    };
    const update = {
      $set: { products: updatedProducts },
    };

    return this.collection.updateOne(filter, update);
  }
}

module.exports = PortfolioRepository;
