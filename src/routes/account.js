const { Router } = require('express');

const router = Router();

router.post('/accounts', async (req, res, next) => {
  const {
    accountService,
  } = req.app.locals.services;

  try {
    const result = await accountService.register(req.body);

    res.status(201).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

router.post('/accounts/login', async (req, res, next) => {
  const {
    accountService,
  } = req.app.locals.services;

  try {
    const result = await accountService.login(req.body);

    res.status(200).json(result);
    return next();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
