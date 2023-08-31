const kafkaConsumer = require('./kafkaConsumerHandler');

describe('#kafkaConsumer', () => {
  const mockCtx = {
    parsedMessage: {
      status: 'FAILED',
      failReason: 'Product on hold',
    },
    services: {
      transactionService: {
        updateTransaction: jest.fn(),
      },
    },
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  it('should invoke update transaction with parsed message as argument', async () => {
    await kafkaConsumer(mockCtx);

    expect(mockCtx.services.transactionService.updateTransaction)
      .toBeCalledWith(mockCtx.parsedMessage);
    expect(mockCtx.logger.info).toHaveBeenCalledTimes(2);
  });

  it('should invoke logger error when error occurred', async () => {
    const error = new Error('');
    mockCtx.services.transactionService.updateTransaction.mockRejectedValue(error);

    await kafkaConsumer(mockCtx);

    expect(mockCtx.logger.error).toHaveBeenCalledWith(error);
  });
});
