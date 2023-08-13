const express = require('express');
const CustomError = require('../utils/error.js');

class App {
  constructor(opts) {
    this.app = express();
    this.app.locals.logger = opts.logger.logger;
    this.app.use(opts.logger);
    this.app.locals.config = opts.config;
    this._initializations = opts.initializations;
    this._teardownServices = opts.teardownServices;

    const { pre, post } = opts.middlewares;

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
      req.log.error(err);

      if (err instanceof CustomError) {
        return res.status(err.statusCode).json(err);
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

    return new Promise((resolve) => {
      const { config: { server: { port } } } = this.app.locals;
      this._server = this.app.listen(port, () => {
        this.app.locals.logger.info(`Server is running on port ${port}`);
        return resolve();
      });
    });
  }

  async stop() {
    if (this._teardownServices && this._teardownServices.length > 0) {
      try {
        const fns = [];
        this._teardownServices.forEach((fn) => {
          fns.push(fn(this.app));
        });

        await Promise.allSettled(fns);
      } catch (e) {
        this.app.locals.logger.error(e);
        throw e;
      }
    }
    this._server.close();
  }
}
module.exports = App;
