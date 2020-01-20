const express = require('express'),
  { HomeController, UserController } = require('../Controllers'),
  router = express.Router();

router.get('/', HomeController.index);
router.get('/users', UserController.getUsers);

module.exports = router;
