const { response } = require('../Utils');

const index = (req, res) => {
  response(res, 200, true, 'Success');
};

module.exports = {
  index
};
