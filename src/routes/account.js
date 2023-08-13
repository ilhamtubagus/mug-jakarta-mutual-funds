const { Router } = require('express');
const { authenticationMiddleware } = require('../middlewares');

const router = Router();

router.get('/test', authenticationMiddleware(), (req, res, next) => {
  res.status(200).json(res.locals.auth);
  return next();
});

router.post('/account', async (req, res, next) => {
  const {
    accountService,
  } = res.locals;

  const result = await accountService.register(req.body);

  res.status(201).json(result);
  return next();
});

router.post('/account/login', async (req, res, next) => {
  const {
    accountService,
  } = res.locals;

  try {
    const result = await accountService.login(req.body);

    res.status(200).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
