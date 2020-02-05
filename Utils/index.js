const response = require('./response');
const redis = require('./redis');
const paramParser = require('./paramParser');
const urlParser = require('./urlParser');
const { hashString, compareHashedString } = require('./bcrypt');
const { signToken, verifyToken } = require('./token');
const {
  randomString, randomNumber, range, generateOTP
} = require('./generator');
const { dateRange, convertDate } = require('./date');
const { uploadCategoryIcon, uploadMenuImages, uploadRestaurantImage } = require('./multer');

module.exports = {
  response,
  redis,
  paramParser,
  urlParser,
  signToken,
  verifyToken,
  hashString,
  compareHashedString,
  randomString,
  randomNumber,
  range,
  generateOTP,
  dateRange,
  convertDate,
  uploadCategoryIcon,
  uploadMenuImages,
  uploadRestaurantImage
};
