/* eslint-disable max-len */
/* eslint-disable no-else-return */
const qs = require('qs');
const {
  response, redis, urlParser
} = require('../Utils');
const { User } = require('../Services');

const getUsers = async (req, res) => {
  const { search, sort } = req.query;
  var numRows;
  var numPerPage = parseInt(req.query.perPage, 10) || 10;
  var page = parseInt(req.query.page, 10) || 1;
  var numPages;
  var skip = (page - 1) * numPerPage;
  var limit;

  await User.getUsersCount(1, search, sort).then((count) => {
    numRows = count[0].count;
    numPages = Math.ceil(numRows / numPerPage);
  }).catch((error) => response(res, 200, false, 'Error. Fetching User Count Failed.', error));

  limit = `${skip},${numPerPage}`;
  const redisKey = qs.stringify({ user_index: '', data: req.query });

  return redis.get(redisKey, async (ex, data) => {
    if (data) {
      const resultJSON = JSON.parse(data);
      return response(res, 200, true, 'Data Found - Redis Cache', resultJSON);
    }
    else {
      const users = await User.getUsers(1, search, sort, limit);
      if (users) {
        // eslint-disable-next-line no-param-reassign
        users.forEach((v) => delete v.password);
        const result = {
          users
        };
        if (page <= numPages) {
          result.pagination = {
            current: page,
            perPage: numPerPage,
            prev: page > 1 ? page - 1 : undefined,
            next: page < numPages ? page + 1 : undefined,
            prevLink: page > 1 ? encodeURI(urlParser(search, sort, page - 1, numPerPage)) : undefined,
            nextLink: page < numPages ? encodeURI(urlParser(search, sort, page + 1, numPerPage)) : undefined
          };
        }
        else {
          result.pagination = {
            err: `queried page ${page} is >= to maximum page number ${numPages}`
          };
        }
        redis.setex(redisKey, 10, JSON.stringify(result));
        return response(res, 200, true, 'Data Found - Database Query', result);
      }
      else {
        return response(res, 200, false, 'Data not Found');
      }
    }
  });
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  await User.getUserById(id).then((user) => {
    if (user) {
      return response(res, 200, true, 'Data Found.', user[0]);
    }
    else {
      return response(res, 200, false, 'Data not Found.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Fetching User By ID', error));
};

const createUser = async (req, res) => {
  await User.createUser(req.body).then(async (result) => {
    const { insertId } = result;
    if(insertId > 0){
      await User.getUserById(insertId).then((_result) => {
        if (_result.length > 0){
          return response(res, 200, true, 'User Created Successfuly.', _result[0]);
        }
        else {
          return response(res, 200, false, 'Fetching User Data Failed. Please Try Again.');
        }
      }).catch((error) => response(res, 200, false, 'Error At Fetching User Data', error));
    }
    else{
      return response(res, 200, false, 'Creating User Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false , 'Error At Creating User', error));
};

const updateUser = async (req, res) => {
  const { id } = req.body;
  await User.updateUser(id, req.body).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      await User.getUserById(id).then((_result) => {
        if(_result.length > 0){
          return response(res, 200, true, 'User Updated Successfuly.', _result[0]);
        }
        else{
          return response(res, 200, false, 'Fetching User Data Failed. Please Try Again');
        }
      }).catch((error) => response(res, 200, false, 'Error At Fetching User By ID', error));
    }
    else {
      return response(res, 200, false, 'Updating User Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating User', error));
};

const deleteUser = async (req, res) => {
  const { id } = req.body;
  await User.deleteUser(id).then(() => {
    const { affectedRows } = result;
    if(affectedRows > 0){
      return response(res, 200, true, 'User Deleted Successfuly.');
    }
    else {
      return response(res, 200, false, 'Deleting User Failed. Please Try Again');
    }
  }).catch((error) => response(res, 200, false, 'Error At Deleting User.', error));
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
