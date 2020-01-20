const response = require('../Utils/response');

const index = (req, res) => {
  response(res, 200, true, 'Success');
};

module.exports = {
  index
};
