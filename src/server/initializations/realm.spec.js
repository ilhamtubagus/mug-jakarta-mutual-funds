const { initializeAtlasFunctions } = require('./realm');

describe('realm', () => {
  const mockCredentials = {};
  const mockAtlasFunctions = {};
  const logIn = jest.fn().mockReturnValue({ functions: mockAtlasFunctions });
  const mockRealm = {
    App: jest.fn().mockReturnValue({ logIn }),
    Credentials: {
      apiKey: jest.fn().mockReturnValue(mockCredentials),
    },
  };
  mockRealm.App.logIn = logIn;
  const mockApp = {
    locals: {
      logger: {
        info: jest.fn(),
      },
      config: {
        realm: {
          apiKey: '12321312dasdasaj101220ws', appId: 'mutual-funds-app',
        },
      },
    },
  };
  describe('#initializeAtlasFunctions', () => {
    it('should assign atlas functions into locals', async () => {
      await initializeAtlasFunctions(mockRealm)(mockApp);

      expect(mockRealm.App).toBeCalledWith({ id: mockApp.locals.config.realm.appId });
      expect(mockRealm.Credentials.apiKey).toBeCalledWith(mockApp.locals.config.realm.apiKey);
      expect(mockRealm.App.logIn).toBeCalledWith(mockCredentials);
      expect(mockApp.locals.atlasFunctions).toBeDefined();
      expect(mockApp.locals.logger.info).toBeCalledTimes(3);
    });
  });
});
