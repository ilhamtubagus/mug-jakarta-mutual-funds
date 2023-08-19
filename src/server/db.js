const _constructConnectionString = ({
  username, password, instances, options, name,
}) => {
  const credentials = `${username}:${password}`;
  const connectionString = `mongodb://${credentials}@${instances}/${name}`;

  return options ? `${connectionString}?${options}` : connectionString;
};
const connectToDb = async (mongodb, app) => {
  const { locals: { logger, config: { db: dbConfig } } } = app;
  const { MongoClient } = mongodb;
  const connectionString = _constructConnectionString(dbConfig);

  const mongoClient = await MongoClient.connect(connectionString);

  logger.info('Connected to database');

  const db = mongoClient.db(dbConfig.name);
  Object.assign(app.locals, { db, mongoClient });

  return {
    mongoClient,
  };
};

const disconnectDb = async (app) => {
  const { locals: { mongoClient, logger } } = app;

  await mongoClient.close();

  logger.info('Disconnected from database');
};

module.exports = { connectToDb, disconnectDb };
