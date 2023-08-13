const { db: { name } } = require('./config');

module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '4.4.21',
      skipMD5: true,
    },
    autoStart: false,
    instance: {
      dbName: name,
    },
  },
};
