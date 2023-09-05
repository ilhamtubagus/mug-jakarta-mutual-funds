const express = require('express');
const cors = require('cors');
const { MongoDBRealmError } = require('realm-web');
const CustomError = require('../utils/error.js');

class App {
  constructor(opts) {
    this.app = express();
    this.app.locals.logger = opts.logger;
    this.app.locals.config = opts.config;
    this._initializations = opts.initializations;
    this._serviceInitializations = opts.serviceInitializations;
    this._consumer = opts.consumer;

    const { pre, post } = opts.middlewares;

    this.app.use(cors({
      origin: '*',
    }));

    if (pre && pre.length > 0) {
      pre.forEach((middleware) => this.app.use(middleware));
    }

    if (opts.routes && opts.routes.length > 0) {
      opts.routes.forEach((route) => this.app.use(route));
    }

    if (post && post.length > 0) {
      post.forEach((middleware) => this.app.use(middleware));
    }

    this.app.use((err, req, res, next) => {
      const { logger } = req.app.locals;
      logger.error(err);

      if (err instanceof CustomError) {
        return res.status(err.statusCode).json(err);
      }

      if (err instanceof MongoDBRealmError) {
        return res.status(500).json({ message: 'Database error', err });
      }

      return res.status(500).json(err);
    });
  }

  async start() {
    if (this._initializations && this._initializations.length > 0) {
      try {
        const fns = [];
        this._initializations.forEach((fn) => {
          fns.push(fn(this.app));
        });

        await Promise.all(fns);
      } catch (e) {
        this.app.locals.logger.error(e);
        throw e;
      }
    }

    if (this._serviceInitializations && this._serviceInitializations.length > 0) {
      try {
        this._serviceInitializations.forEach((fn) => {
          fn(this.app);
        });
      } catch (e) {
        this.app.locals.logger.error(e);
        throw e;
      }
    }

    await this._consumer(this.app);

    return new Promise((resolve) => {
      const { config: { server: { port } } } = this.app.locals;
      this._server = this.app.listen(port, () => {
        this.app.locals.logger.info(`Server is running on port ${port}`);
        return resolve();
      });
    });
  }

  async stop() {
    this._server.close();
  }
}
module.exports = App;
