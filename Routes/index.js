const express = require('express'),
  {
    HomeController,
    UserController,
    AuthController,
    CartController,
    CategoryController,
    ItemController,
  } = require('../Controllers'),
  router = express.Router();
const { auth, hasRole } = require('../Services/middleware');
const { uploadCategoryIcon, uploadMenuImages } = require('../Utils');

router
  .get('/', HomeController.index);

router
  .get('/user', UserController.getUsers)
  .get('/user/:id', UserController.getUserById)
  .post('/user', auth, hasRole('administrator'), UserController.createUser)
  .patch('/user/:id', auth, hasRole('administrator'), UserController.updateUser)
  .delete('/user/:id', auth, hasRole('administrator'), UserController.deleteUser);

router
  .get('/cart', auth, hasRole('customer'), CartController.getCart)
  .post('/cart', auth, hasRole('customer'), CartController.addItemToCart)
  .patch('/cart/:itemId', auth, hasRole('customer'), CartController.updateItemInCart)
  .delete('/cart/:itemId', auth, hasRole('customer'), CartController.deleteItemInCart);

router
  .get('/category', CategoryController.getCategories)
  .get('/category/:id', CategoryController.getCategory)
  .post('/category', auth, hasRole('administrator'), uploadCategoryIcon, CategoryController.createCategory)
  .patch('/category/:id', auth, hasRole('administrator'), uploadCategoryIcon, CategoryController.updateCategory)
  .delete('/category/:id', auth, hasRole('administrator'), CategoryController.deleteCategory);

router
  .get('/item', ItemController.getItems)
  .get('/item/:id', ItemController.getItem)
  .post('/item', auth, hasRole(['administrator', 'restaurant']), uploadMenuImages, ItemController.createItem)
  .patch('/item/:id', auth, hasRole(['administrator', 'restaurant']), uploadMenuImages, ItemController.updateItem)
  .delete('/item/:id', auth, hasRole(['administrator', 'restaurant']), ItemController.deleteItem);

router
  .post('/login', AuthController.loginUser)
  .post('/register', AuthController.registerUser)
  .post('/token/check', AuthController.checkToken)
  .get('/logout', AuthController.logoutUser);

module.exports = router;
