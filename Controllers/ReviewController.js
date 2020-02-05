const { Review } = require('../Services');
const { response } = require('../Utils');

const getItemReview = async (req, res) => {
  const { id } = req.params;

  await Review.getItemReview(id).then((result) => {
    if (result.length > 0) {
      return response(res, 200, true, 'Data Found.', result[0]);
    }

    return response(res, 200, true, 'Your Review Is Empty.');
  }).catch((error) => response(res, 200, false, 'Error At Fetching Review Data.', error));
};

const getUserReview = async (req, res) => {
  const { id } = req.auth;

  await Review.getUserReview(id).then((result) => {
    if (result.length > 0) {
      return response(res, 200, true, 'Data Found.', result[0]);
    }

    return response(res, 200, true, 'Your Review Is Empty.');
  }).catch((error) => response(res, 200, false, 'Error At Fetching Review Data.', error));
};

const createReview = async (req, res) => {
  const { id } = req.auth;
  req.body.item_id = req.params.id;
  await Review.createItemReview(id, req.body).then(async (result) => {
    const { insertId } = result;
    if (insertId > 0) {
      return response(res, 200, true, 'Review Added Successfuly.');
    }

    return response(res, 200, false, 'Adding Review Failed. Please Try Again.');
  }).catch((error) => response(res, 200, false, 'Error At Adding Review', error));
};

const updateReview = async (req, res) => {
  const { id } = req.auth;
  const { itemId } = req.params;
  await Review.updateItemReview(id, itemId, req.body).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      return response(res, 200, true, 'Review Updated Successfuly.');
    }

    return response(res, 200, false, 'Updating Review Failed. Please Try Again');
  }).catch((error) => response(res, 200, false, 'Error At Updating Review', error));
};

const deleteReview = async (req, res) => {
  const { id } = req.params;
  await Review.deleteItemReview(id).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      return response(res, 200, true, 'Review Deleted Successfuly.');
    }

    return response(res, 200, false, 'Deleting Review Failed. Please Try Again.');
  }).catch((error) => response(res, 200, false, 'Error At Deleting Review.', error));
};

module.exports = {
  getItemReview,
  getUserReview,
  createReview,
  updateReview,
  deleteReview
};
