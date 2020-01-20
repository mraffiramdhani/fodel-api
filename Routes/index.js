const express = require('express'),
  { HomeController } = require('../Controllers'),
  router = express.Router();

router.get('/', HomeController.index);

module.exports = router;
