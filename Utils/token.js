require('dotenv').config();
const jwt = require('jsonwebtoken');

const signToken = (data) => {
  return jwt.sign(data, process.env.APP_KEY);
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.APP_KEY);
};

module.exports = {
  signToken,
  verifyToken
};
