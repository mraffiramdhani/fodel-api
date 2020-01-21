/* eslint-disable max-len */
/* eslint-disable no-else-return */
const qs = require('qs'),
  bcrypt = require('bcryptjs');
const {
  response, redis, urlParser, signToken, verifyToken
} = require('../Utils');
const { User, Token } = require('../Services');

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
  const user = await User.getUserById(id);
  if (user) {
    return response(res, 200, true, 'Data Found.', user[0]);
  }
  else {
    return response(res, 200, false, 'Data not Found.');
  }
};

// eslint-disable-next-line consistent-return
const registerUser = async (req, res) => {
  const { name, username, password } = req.body;
  const fixedRoleId = 3;
  var data = {
    name, username, password, role_id: fixedRoleId
  };

  if (!data.name || !data.username || !data.password) {
    return response(res, 200, false, 'Please provide a valid data.');
  }
  else {
    await User.createUser(data).then(() => {
      const token = signToken({ name, username, role_id: fixedRoleId });
      Token.putToken({ token }, (err) => {
        if (err) {
          return response(res, 200, false, 'Error', err);
        }
        else {
          return response(res, 200, true, 'User Created Successfully.', { token, name, username });
        }
      });
    }).catch((error) => response(res, 200, false, 'Error.', error));
  }
};

const checkToken = async (req, res) => {
  const { token } = req.body;
  await Token.isRevoked(token).then((data) => {
    const auth = verifyToken(token);
    if (data.length === 0) {
      if (auth.role_id === 1) {
        return response(res, 200, true, 'Authentication Success.', {
          role: 'administrator',
          name: auth.name
        });
      }
      else if (auth.role_id === 2) {
        return response(res, 200, true, 'Authentication Success.', {
          role: 'restaurant',
          name: auth.name
        });
      }
      else if (auth.role_id === 3) {
        return response(res, 200, true, 'Authentication Success.', {
          role: 'customer',
          name: auth.name
        });
      }
    }
    else {
      return response(res, 200, true, 'Session Expired. Please Login Again.');
    }
  }).catch((error) => {
    return response(res, 200, false, 'Error.', error);
  });
};

// eslint-disable-next-line consistent-return
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return response(res, 200, false, 'Please Provide a Valid Data.');
  }
  else {
    const user = await User.getUserByUsername(username);
    if (user.length > 0) {
      if (bcrypt.compareSync(password, user[0].password)) {
        // eslint-disable-next-line camelcase
        const { id, name, role_id } = user[0];
        const token = signToken({
          id, name, username, role_id
        });
      }
    }
  }
}

module.exports = {
  getUsers,
  getUserById,
  registerUser,
  checkToken
};
