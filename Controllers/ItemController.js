/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-else-return */
const qs = require('qs');
const {
  response, redis, urlParser
} = require('../Utils');
const { Item } = require('../Services');

const getItems = async (req, res) => {
  const { search, sort } = req.query;
  var numRows;
  var numPerPage = parseInt(req.query.perPage, 10) || 10;
  var page = parseInt(req.query.page, 10) || 1;
  var numPages;
  var skip = (page - 1) * numPerPage;
  var limit;

  await Item.getItemCount(search, sort).then((count) => {
    numRows = count.length;
    numPages = Math.ceil(numRows / numPerPage);
  }).catch((error) => response(res, 200, false, 'Error. Fetching Item Count Failed.', error));

  limit = `${skip},${numPerPage}`;
  const redisKey = qs.stringify({ item_index: '', data: req.query });

  return redis.get(redisKey, async (ex, data) => {
    if (data) {
      const resultJSON = JSON.parse(data);
      return response(res, 200, true, 'Data Found - Redis Cache', resultJSON);
    }
    else {
      const items = await Item.getItems(search, sort, limit);
      if (items) {
        const result = {
          items
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

const getItem = async (req, res) => {
  const { id } = req.params;
  await Item.getItem(id).then((item) => {
    if (item) {
      return response(res, 200, true, 'Data Found.', item[0]);
    }
    else {
      return response(res, 200, false, 'Data not Found.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Fetching Item By ID', error));
};

const createItem = async (req, res) => {
  const { id, role_id } = req.auth;

  if (role_id === 2) {
    req.body.restaurant_id = id;
  }
  req.body.image = [];
  req.files.map((v) => req.body.image.push(v.filename));

  await Item.createItem(req.body).then((result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      return response(res, 200, true, 'Item Created Successfuly.');
    }
    else {
      return response(res, 200, false, 'Creating Item Failed.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Creating Item', error));
};

const updateItem = async (req, res) => {
  const { id } = req.params;

  req.body.image = [];
  req.files.map((v) => req.body.image.push(v.filename));

  await Item.updateItem(id, req.body).then(async (result) => {
    const { affectedRows } = result[0];
    if (affectedRows > 0) {
      return response(res, 200, true, 'Item Updated Successfuly.');
    }
    else {
      return response(res, 200, false, 'Updating Item Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating Item', error));
};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  await Item.deleteItem(id).then((result) => {
    const { affectedRows } = result[0];
    if (affectedRows > 0) {
      return response(res, 200, true, 'Item Deleted Successfuly.');
    }
    else {
      return response(res, 200, false, 'Deleting Item Failed. Please Try Again');
    }
  }).catch((error) => response(res, 200, false, 'Error At Deleting Item.', error));
};

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
