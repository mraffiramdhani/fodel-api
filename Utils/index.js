const response = require('./response');
const redis = require('./redis');
const paramParser = require('./paramParser');
const urlParser = require('./urlParser');
const { sendEmail } = require('./mail');
const { hashString, compareHashedString } = require('./bcrypt');
const { signToken, verifyToken } = require('./token');
const { randomString, randomNumber, range, generateOTP } = require('./generator');
const { uploadProfileImage, uploadHotelImages, uploadHotelRoomImages, uploadAmenityIcon } = require('./fileSystem');
const { dateRange, convertDate } = require('./date');

module.exports = {
  response,
  redis,
  paramParser,
  urlParser,
  signToken,
  verifyToken,
  hashString,
  compareHashedString,
  sendEmail,
  randomString,
  randomNumber,
  range,
  generateOTP,
  uploadProfileImage,
  uploadHotelImages,
  uploadHotelRoomImages,
  uploadAmenityIcon,
  dateRange,
  convertDate
};
