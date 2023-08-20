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
                as: 'nav',
              },
            },
            {
              $addFields: {
                nav: {
                  $first: '$nav.currentValue',
                },
              },
            },
          ],
        },
      },
      {
        $unset: ['_id', 'fetchedProducts._id'],
      },
      {
        $project: {
          cif: 1,
          portfolioCode: 1,
          name: 1,
          createdAt: 1,
          modifiedAt: 1,
          products: {
            $map: {
              input: '$products',
              in: {
                $mergeObjects: [
                  {
                    units: '$$this.units',
                    capitalInvestment:
                        '$$this.capitalInvestment',
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
}

module.exports = PortfolioRepository;
