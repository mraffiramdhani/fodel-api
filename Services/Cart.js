const conn = require('./db');

const getCart = (userId) => {
  const sql = 'SELECT * FROM carts WHERE user_id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  }).then(async (cart) => {
    const itemSql = 'SELECT * FROM item_images WHERE item_id = ?';

    for(let i = 0; i < cart.length; i++){
      const image = new Promise((resolve, reject) => {
        conn.query(itemSql, [cart[i].item_id], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });

      await image.then((images) => {
        cart[i].images = images;
      }).catch((error) => error);
    }

    return cart;
  }).then(async (cart) => {
    const itemDetailSql = 'SELECT * FROM items WHERE id = ?';

    for(let i = 0; i < cart.length; i++){
      const item = new Promise((resolve, reject) => {
        conn.query(itemDetailSql, [cart[i].item_id], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });

      await item.then((details) => {
        cart[i].details = details[0];
      }).catch((error) => error);
    }

    return cart;
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

const deleteItemInCart = (userId, cartId) => {
  const sql = 'DELETE FROM carts WHERE user_id = ? AND id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [userId, cartId], (err, res) => {
      if (err) reject(err);
      console.log(res);
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
