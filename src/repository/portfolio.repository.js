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
      }, {
        $lookup: {
          from: 'products',
          localField: 'products.productCode',
          foreignField: 'productCode',
          as: 'fetchedProducts',
        },
      }, {
        $lookup: {
          from: 'navs',
          let: {
            productCode: {
              $first: '$fetchedProducts.productCode',
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$productCode', '$$productCode',
                  ],
                },
              },
            }, {
              $sort: {
                createdAt: -1,
              },
            }, {
              $limit: 1,
            },
          ],
          as: 'currentNav',
        },
      }, {
        $addFields: {
          'products.currentNav': {
            $first: '$currentNav.currentValue',
          },
          'products.name': {
            $first: '$fetchedProducts.name',
          },
          'products.productCategory': {
            $first: '$fetchedProducts.productCategory',
          },
          'products.imageUrl': {
            $first: '$fetchedProducts.imageUrl',
          },
          'products.sellFee': {
            $first: '$fetchedProducts.sellFee',
          },
          'products.buyFee': {
            $first: '$fetchedProducts.buyFee',
          },
        },
      }, {
        $project: {
          currentNav: 0,
          _id: 0,
          'products._id': 0,
          fetchedProducts: 0,
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
