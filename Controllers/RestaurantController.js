/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-else-return */
const qs = require('qs');
const {
  response, redis, urlParser, hashString
} = require('../Utils');
const { Restaurant, User } = require('../Services');

const registerRestaurant = async (req, res) => {
  const { password } = req.body;
  const encPass = hashString(password);
  req.body.password = encPass;
  req.body.role_id = 3;

  await User.createUser(req.body).then(async (result) => {
    const { insertId } = result;
    if (insertId > 0) {
      const data = {
        name: req.body.restaurant_name,
        user_id: insertId,
      }

      await Restaurant.createRestaurant(data).then((_result) => {
        if (_result.insertId > 0) {
          return response(res, 200, true, 'Request Sended');
        }
        else {
          return response(res, 200, false, 'Creating Restaurant Failed. Please Try Again.');
        }
      }).catch((error) => response(res, 200, false, 'Error At Creating Restaurant.', error));
    }
    else {
      return response(res, 200, false, 'Creating Restaurant User Failed. Please Try Again');
    }
  }).catch((error) => response(res, 200, false, 'Error At Creating Restaurant User.', error));
};

const approveRestaurant = async (req, res) => {
  const { id } = req.params;

  await Restaurant.updateRestaurant(id, {active:1}).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      const restaurant = await Restaurant.getRestaurant(id);
      if (restaurant) {
        await User.updateUser(restaurant[0].user_id, {role_id: 2}).then((_result) => {
          const { affectedRows } = _result;
          if (affectedRows > 0) {
            return response(res, 200, true, 'Restaurant Approved.');
          }
          else {
            return response(res, 200, false, 'Updating User Data Failed. Please Try Again.');
          }
        }).catch((error) => response(res, 200, false, 'Error At Updating User Data.', error));
      }
      else {
        return response(res, 200, false, 'Fetching Restaurant Data Failed. Please Try Again.')
      }
    }
    else {
      return response(res, 200, false, 'Updating Restaurant Status Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating Restaurant Status', error));
};

const getRestaurants = async (req, res) => {
  const { search, sort } = req.query;
  var numRows;
  var numPerPage = parseInt(req.query.perPage, 10) || 10;
  var page = parseInt(req.query.page, 10) || 1;
  var numPages;
  var skip = (page - 1) * numPerPage;
  var limit;

  await Restaurant.getRestaurantCount(search, sort).then((count) => {
    numRows = count.length;
    numPages = Math.ceil(numRows / numPerPage);
  }).catch((error) => response(res, 200, false, 'Error. Fetching Restaurant Count Failed.', error));

  limit = `${skip},${numPerPage}`;
  const redisKey = qs.stringify({ resto_index: '', data: req.query });

  return redis.get(redisKey, async (ex, data) => {
    if (data) {
      const resultJSON = JSON.parse(data);
      return response(res, 200, true, 'Data Found - Redis Cache', resultJSON);
    }
    else {
      const restaurants = await Restaurant.getRestaurants(search, sort, limit);
      if (restaurants) {
        const result = {
          restaurants
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

const getRestaurant = async (req, res) => {
  const { id } = req.params;
  await Restaurant.getRestaurant(id).then((restaurant) => {
    if (restaurant) {
      return response(res, 200, true, 'Data Found.', restaurant[0]);
    }
    else {
      return response(res, 200, false, 'Data not Found.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Fetching Restaurant By ID', error));
};

const createRestaurant = async (req, res) => {
  if (req.file !== null && req.file !== undefined) {
    const { filename } = req.file;
    req.body.logo = filename;
  }

  await Restaurant.createRestaurant(req.body).then(async (result) => {
    const { insertId } = result;
    if (insertId > 0) {
      await User.updateUser(req.body.user_id, { role_id: 2 }).then(async () => {
        await Restaurant.getRestaurant(insertId).then((_result) => {
          if (_result.length > 0) {
            return response(res, 200, true, 'Restaurant Created Successfuly.');
          }
          else {
            return response(res, 200, false, 'Fetching Restaurant Data Failed. Please Try Again.');
          }
        }).catch((error) => response(res, 200, false, 'Error At Fetching Restaurant Data', error));
      }).catch((error) => response(res, 200, false, 'Error At Updatinf User Role', error));
    }
    else {
      return response(res, 200, false, 'Creating Restaurant Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Creating Restaurant', error));
};

const updateRestaurant = async (req, res) => {
  const { id } = req.params;
  if (req.file !== null && req.file !== undefined) {
    const { filename } = req.file;
    req.body.logo = filename;
  }

  await Restaurant.updateRestaurant(id, req.body).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      return response(res, 200, true, 'Restaurant Updated Successfuly.');
    }
    else {
      return response(res, 200, false, 'Updating Restaurant Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating Restaurant', error));
};

const deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  await Restaurant.deleteRestaurant(id).then((result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      return response(res, 200, true, 'Restaurant Deleted Successfuly.');
    }
    else {
      return response(res, 200, false, 'Deleting Restaurant Failed. Please Try Again');
    }
  }).catch((error) => response(res, 200, false, 'Error At Deleting Restaurant.', error));
};

module.exports = {
  registerRestaurant,
  approveRestaurant,
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
