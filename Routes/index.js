const express = require('express'),
  {
    HomeController,
    UserController,
    AuthController,
    CartController,
    CategoryController,
    ItemController,
    RestaurantController,
    ReviewController
  } = require('../Controllers'),
  router = express.Router();
const { auth, hasRole } = require('../Services/middleware');
const { uploadCategoryIcon, uploadMenuImages, uploadRestaurantImage, uploadProfilePhoto } = require('../Utils');

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
  .get('/cart/:itemId', auth, hasRole('customer'), CartController.getCartById)
  .post('/cart', auth, hasRole('customer'), CartController.addItemToCart)
  .patch('/cart/:itemId', auth, hasRole('customer'), CartController.updateItemInCart)
  .patch('/checkout/cart', auth, hasRole('customer'), CartController.checkoutCart)
  .delete('/cart/:itemId', auth, hasRole('customer'), CartController.deleteItemInCart);

router
  .get('/category', CategoryController.getCategories)
  .get('/category/:id', CategoryController.getCategory)
  .post('/category', auth, hasRole('administrator'), uploadCategoryIcon, CategoryController.createCategory)
  .patch('/category/:id', auth, hasRole('administrator'), uploadCategoryIcon, CategoryController.updateCategory)
  .delete('/category/:id', auth, hasRole('administrator'), CategoryController.deleteCategory);

router
  .get('/item', auth, ItemController.getItems)
  .get('/item/:id', auth, ItemController.getItem)
  .get('/count/item', auth, ItemController.getCount)
  .post('/item', auth, hasRole(['administrator', 'restaurant']), uploadMenuImages, ItemController.createItem)
  .patch('/item/:id', auth, hasRole(['administrator', 'restaurant']), uploadMenuImages, ItemController.updateItem)
  .delete('/item/:id', auth, hasRole(['administrator', 'restaurant']), ItemController.deleteItem);

router
  .get('/restaurant', RestaurantController.getRestaurants)
  .get('/restaurant/:id', RestaurantController.getRestaurant)
  .post('/restaurant', auth, hasRole('administrator'), uploadRestaurantImage, RestaurantController.createRestaurant)
  .post('/restaurant/register', RestaurantController.registerRestaurant)
  .patch('/restaurant/:id', auth, hasRole(['administrator', 'restaurant']), uploadRestaurantImage, RestaurantController.updateRestaurant)
  .patch('/restaurant/approve/:id', auth, hasRole('administrator'), RestaurantController.approveRestaurant)
  .delete('/restaurant/:id', auth, hasRole(['administrator', 'restaurant']), RestaurantController.deleteRestaurant);

router
  .get('/review/:id', ReviewController.getItemReview)
  .get('/review', auth, hasRole('customer'), ReviewController.getUserReview)
  .post('/review', auth, hasRole('customer'), ReviewController.createReview)
  .patch('/review/:itemId', auth, hasRole(['administrator', 'customer']), ReviewController.updateReview)
  .delete('/review/:id', auth, hasRole(['administrator', 'customer']), ReviewController.deleteReview);

router
  .post('/login', AuthController.loginUser)
  .post('/register', AuthController.registerUser)
  .post('/token/check', AuthController.checkToken)
  .post('/password', AuthController.forgotPassword)
  .patch('/password/reset', auth, AuthController.updateProfile)
  .patch('/profile/photo', auth, uploadProfilePhoto, AuthController.updateProfilePhoto)
  .get('/profile', auth, AuthController.getProfile)
  .get('/logout', AuthController.logoutUser);

module.exports = router;
