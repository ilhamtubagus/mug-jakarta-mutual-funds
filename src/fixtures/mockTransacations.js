const transactions = [
  {
    transactionID: 'GT1LXXJW9UHZL1P',
    cif: 'C6DTCTKBST',
    amount: 20000,
    units: 12.5,
    product: {
      name: 'Schroder Dana Equity',
      productCode: 'SCHE',
      imageUrl: '',
      productCategory: 'equity',
      sellFee: 0.2,
      buyFee: 0.2,
      tax: 0,
      createdAt: new Date(),
      investmentManager: {
        investmentManagerCode: 'SCH',
        name: 'Schroder',
        custodianBank: 'Bank BTPN',
      },
      nav: 1600,
    },
    type: 'BUY',
    status: 'PENDING',
    portfolioCode: '001',
    modifiedAt: { $date: { $numberLong: '1692587932903' } },
    createdAt: { $date: { $numberLong: '1692587932903' } },
  },
];
module.exports = transactions;