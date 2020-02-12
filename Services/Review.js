const conn = require('./db');

const getItemReview = (id) => {
  const sql = 'SELECT * FROM reviews WHERE item_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getUserReview = (id) => {
  const sql = 'SELECT * FROM reviews WHERE user_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const createItemReview = (id, data) => {
  const { reviews } = data;
  const arr = [];
  reviews.map((v) => {
    arr.push(`(${v.rating}, ${v.review}, ${v.item_id}, ${id})`);
  })
  console.log(arr, reviews);
  const sql = `INSERT INTO reviews(rating, review, item_id, user_id) VALUES ${arr.join()}`;
  console.log(sql);

  return new Promise((resolve, reject) => {
    conn.query(sql, [rating, review, item_id, id], (err, res) => {
      if (err) reject(err);
      console.log(res);
      resolve(res);
    });
  });
};

const updateItemReview = (id, itemId, data) => {
  const sql = 'UPDATE reviews SET ? WHERE id = ? AND user_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [data, itemId, id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const deleteItemReview = (id) => {
  const sql = 'DELETE FROM reviews WHERE id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  getItemReview,
  getUserReview,
  createItemReview,
  updateItemReview,
  deleteItemReview
};
