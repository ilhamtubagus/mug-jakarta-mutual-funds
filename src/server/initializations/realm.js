const initializeAtlasFunctions = (Realm) => async (app) => {
  const {
    locals: {
      logger, config: {
        realm: {
          apiKey, appId,
        },
      },
    },
  } = app;

  const realmApp = new Realm.App({ id: appId });
  const credentials = Realm.Credentials.apiKey(apiKey);

  logger.info('Connecting to realm');
  const systemUser = await realmApp.logIn(credentials);
  logger.info('Connected to realm');

  const { functions: atlasFunctions } = systemUser;

  Object.assign(app.locals, { atlasFunctions });
  logger.info('Atlas functions ready to be invoked');
};

module.exports = { initializeAtlasFunctions };
