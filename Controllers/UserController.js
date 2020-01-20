const { response } = require('../Utils');
const { User } = require('../Services');

const getUsers = async (req, res) => {
  const {search, sort} = req.query;
  var numRows;
  var numPerPage = parseInt(req.query.perPage, 10) || 10;
  var page = parseInt(req.query.page, 10) || 1;
  var numPages;
  var skip = (page - 1) * numPerPage;
  var limit;

  await User.getUsersCount(1, search, sort).then((count) => {
    numRows = count[0].count;
    numPages = Math.ceil(numRows / numPerPage);
  }).catch((error) => {
    return response(res, 200, false, 'Error. Fetching User Count Failed.', error);
  });

  limit = `${skip},${numPerPage}`;

  const data = await User.getUsers(1, search, sort, limit);

  response(res, 200, true, 'Success', data);
};

module.exports = {
  getUsers
};
