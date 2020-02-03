const express = require('express'),
  { HomeController, UserController, AuthController } = require('../Controllers'),
  router = express.Router();
const { auth, hasRole } = require('../Services/middleware');

router
  .get('/', HomeController.index);

router
  .get('/user', UserController.getUsers)
  .get('/user/:id', UserController.getUserById)
  .post('/user', auth, hasRole('administrator'), UserController.createUser)
  .patch('/user/:id', auth, hasRole('administrator'), UserController.updateUser)
  .delete('/user/:id', auth, hasRole('administrator'), UserController.deleteUser);

router
  .post('/login', AuthController.loginUser)
  .post('/register', AuthController.registerUser)
  .post('/token/check', AuthController.checkToken)
  .get('/logout', AuthController.logoutUser);

module.exports = router;
