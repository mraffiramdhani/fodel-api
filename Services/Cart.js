const conn = require('./db');

const getCart = (userId) => {
  const sql = 'SELECT * FROM carts WHERE user_id = ? AND is_complete = 0';

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

const getCartById = (userId, cartId) => {
  const sql = 'SELECT * FROM carts WHERE id = ? AND user_id = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [cartId, userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const addItemToCart = (userId, data) => {
  const { item_id, quantity, description } = data;
  const sql = 'SELECT * FROM carts WHERE user_id = ? AND item_id = ? AND is_complete = 0';
  return new Promise((resolve, reject) => {
    conn.query(sql, [userId, item_id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  }).then(async (cart) => {
    if(cart.length > 0){
      const upSql = 'UPDATE carts SET quantity = ?, description = ? WHERE user_id = ? AND item_id = ? is_complete = 0';
      return new Promise((resolve, reject) => {
        conn.query(upSql, [quantity, description, userId, item_id], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });
    }
    else {
      const inSql = 'INSERT INTO carts(item_id, quantity, description, user_id) VALUES(?,?,?,?)';
      return new Promise((resolve, reject) => {
        conn.query(inSql, [item_id, quantity, description, userId], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });
    }
  });
};

const updateItemInCart = (userId, cartId, data) => {
  const sql = 'UPDATE carts SET ? WHERE id = ? AND user_id = ? AND is_complete = 0';

  return new Promise((resolve, reject) => {
    conn.query(sql, [data, cartId, userId], (err, res) => {
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
      resolve(res);
    });
  });
};

const checkoutCart = (userId) => {
  const sql = 'UPDATE carts SET is_complete = 1 WHERE user_id = ? AND is_complete = 0';

  return new Promise((resolve, reject) => {
    conn.query(sql, [userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
}

module.exports = {
  getCart,
  getCartById,
  addItemToCart,
  updateItemInCart,
  deleteItemInCart,
  checkoutCart
};
