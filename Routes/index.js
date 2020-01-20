const express = require('express'),
  { HomeController, UserController } = require('../Controllers'),
  router = express.Router();

router
  .get('/', HomeController.index)

  .get('/user', UserController.getUsers)
  .get('/user/:id', UserController.getUserById);

module.exports = router;
