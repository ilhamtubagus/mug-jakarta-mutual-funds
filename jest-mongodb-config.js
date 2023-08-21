const { db: { name } } = require('./config');

module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '6.0.9',
      skipMD5: true,
    },
    autoStart: false,
    instance: {
      dbName: name,
    },
  },
};
