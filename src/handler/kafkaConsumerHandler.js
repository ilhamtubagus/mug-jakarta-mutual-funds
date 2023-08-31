const kafkaConsumerHandler = async (ctx) => {
  const {
    logger,
    services,
    parsedMessage,
  } = ctx;

  try {
    logger.info('Processing update transaction for', parsedMessage);
    await services.transactionService.updateTransaction(parsedMessage);
    logger.info('Done processing transaction for', parsedMessage);
  } catch (e) {
    logger.error(e);
  }
};

module.exports = kafkaConsumerHandler;
