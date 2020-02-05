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

// const getCategory = (id) => {
//   const sql = 'SELECT * FROM categories WHERE id = ?';

//   return new Promise((resolve, reject) => {
//     conn.query(sql, [id], (err, res) => {
//       if (err) reject(err);
//       resolve(res);
//     });
//   });
// };

const createItemReview = (id, data) => {
  const { rating, review, item_id } = data;
  const sql = 'INSERT INTO reviews(rating, review, item_id) VALUES(?,?,?)';

  return new Promise((resolve, reject) => {
    conn.query(sql, [rating, review, item_id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const updateItemReview = (id, data) => {
  const sql = 'UPDATE reviews SET ? WHERE id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [data, id], (err, res) => {
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
