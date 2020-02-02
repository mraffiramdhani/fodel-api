const express = require('express'),
  { HomeController, UserController, AuthController } = require('../Controllers'),
  router = express.Router();

router
  .get('/', HomeController.index);

router
  .get('/user', UserController.getUsers)
  .get('/user/:id', UserController.getUserById);

router
  .post('/login', AuthController.loginUser)
  .post('/register', AuthController.registerUser)
  .post('/token/check', AuthController.checkToken)
  .get('/logout', AuthController.logoutUser);

module.exports = router;
