/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-else-return */
const qs = require('qs');
const {
  response, redis, urlParser
} = require('../Utils');
const { Category } = require('../Services');

const getCategories = async (req, res) => {
  const { search, sort } = req.query;
  var numRows;
  var numPerPage = parseInt(req.query.perPage, 10) || 10;
  var page = parseInt(req.query.page, 10) || 1;
  var numPages;
  var skip = (page - 1) * numPerPage;
  var limit;

  await Category.getCategoryCount(search, sort).then((count) => {
    numRows = count[0].count;
    numPages = Math.ceil(numRows / numPerPage);
  }).catch((error) => response(res, 200, false, 'Error. Fetching Category Count Failed.', error));

  limit = `${skip},${numPerPage}`;
  const redisKey = qs.stringify({ cat_index: '', data: req.query });

  return redis.get(redisKey, async (ex, data) => {
    if (data) {
      const resultJSON = JSON.parse(data);
      return response(res, 200, true, 'Data Found - Redis Cache', resultJSON);
    }
    else {
      const categories = await Category.getCategories(search, sort, limit);
      if (categories) {
        const result = {
          categories
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

const getCategory = async (req, res) => {
  const { id } = req.params;
  await Category.getCategory(id).then((category) => {
    if (category) {
      return response(res, 200, true, 'Data Found.', category[0]);
    }
    else {
      return response(res, 200, false, 'Data not Found.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Fetching Category By ID', error));
};

const createCategory = async (req, res) => {
  if (req.file !== null && req.file !== undefined) {
    const { filename } = req.file;
    req.body.icon = filename;
  }
  await Category.createCategory(req.body).then(async (result) => {
    const { insertId } = result;
    if (insertId > 0) {
      await Category.getCategory(insertId).then((_result) => {
        if (_result.length > 0) {
          return response(res, 200, true, 'Category Created Successfuly.', _result[0]);
        }
        else {
          return response(res, 200, false, 'Fetching Category Data Failed. Please Try Again.');
        }
      }).catch((error) => response(res, 200, false, 'Error At Fetching Category Data', error));
    }
    else {
      return response(res, 200, false, 'Creating Category Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Creating Category', error));
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  if (req.file !== null && req.file !== undefined) {
    const { filename } = req.file;
    req.body.icon = filename;
  }
  await Category.updateCategory(id, req.body).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      await Category.getCategory(id).then((_result) => {
        if (_result.length > 0) {
          return response(res, 200, true, 'Category Updated Successfuly.', _result[0]);
        }
        else {
          return response(res, 200, false, 'Fetching Category Data Failed. Please Try Again');
        }
      }).catch((error) => response(res, 200, false, 'Error At Fetching Category By ID', error));
    }
    else {
      return response(res, 200, false, 'Updating Category Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating Categgory', error));
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  await Category.deleteCategory(id).then((result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      return response(res, 200, true, 'Category Deleted Successfuly.');
    }
    else {
      return response(res, 200, false, 'Deleting Category Failed. Please Try Again');
    }
  }).catch((error) => response(res, 200, false, 'Error At Deleting Category.', error));
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
