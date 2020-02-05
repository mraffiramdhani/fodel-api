const conn = require('./db');

const getCart = (userId) => {
  const sql = 'SELECT * FROM carts WHERE user_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const addItemToCart = (userId, data) => {
  const { item_id, quantity, description } = data;
  const sql = 'INSERT INTO carts(item_id, quantity, description, user_id) VALUES(?,?,?,?)';
  return new Promise((resolve, reject) => {
    conn.query(sql, [item_id, quantity, description, userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const updateItemInCart = (userId, itemId, data) => {
  const sql = 'UPDATE carts SET ? WHERE item_id = ? AND user_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [data, itemId, userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const deleteItemInCart = (userId, itemId) => {
  const sql = 'DELETE FROM carts WHERE user_id = ? AND item_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [userId, itemId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemInCart,
  deleteItemInCart
};
