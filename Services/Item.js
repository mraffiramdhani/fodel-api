/* eslint-disable no-else-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
const conn = require('./db');
const { paramParser } = require('../Utils');

const getItemCount = (search, sort) => {
  const sql = 'SELECT items.* FROM items INNER JOIN item_category ON item_category.item_id = items.id';
  const parsedSql = paramParser(sql, search, sort, null, true, 'GROUP BY items.id');

  return new Promise((resolve, reject) => {
    conn.query(parsedSql, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getItems = (search, sort, limit) => {
  const sql = 'SELECT items.*, (SELECT ROUND(AVG(rating),1) FROM reviews WHERE reviews.item_id = items.id) rating FROM items INNER JOIN item_category ON item_category.item_id = items.id';
  const parsedSql = paramParser(sql, search, sort, limit, true, 'GROUP BY items.id');

  return new Promise((resolve, reject) => {
    conn.query(parsedSql, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  }).then(async (items) => {
    const imageSql = 'SELECT filename FROM item_images WHERE item_id = ?';

    for (let i = 0; i < items.length; i++) {
      const image = new Promise((resolve, reject) => {
        conn.query(imageSql, [items[i].id], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });
      await image.then((images) => {
        items[i].images = images;
      }).catch((error) => error);
    }

    return items;
  }).then(async (items) => {
    const categorySql = 'SELECT * FROM categories INNER JOIN item_category ON categories.id = item_category.category_id WHERE item_category.item_id = ?';

    for (let i = 0; i < items.length; i++) {
      const category = new Promise((resolve, reject) => {
        conn.query(categorySql, [items[i].id], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });

      await category.then((categories) => {
        items[i].categories = categories;
      }).catch((error) => error);
    }

    return items;
  }).catch((error) => error);
};

const getItem = (id) => {
  const sql = 'SELECT items.*, (SELECT ROUND(AVG(rating),1) FROM reviews WHERE reviews.item_id = items.id) rating FROM items where items.id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  }).then(async (item) => {
    const imageSql = 'SELECT filename FROM item_images WHERE item_id = ?';

    const image = new Promise((resolve, reject) => {
      conn.query(imageSql, [item[0].id], (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });

    await image.then((images) => {
      item[0].images = images;
    }).catch((error) => error);

    return item;
  }).then(async (item) => {
    const categorySql = 'SELECT * FROM categories INNER JOIN item_category ON categories.id = item_category.category_id WHERE item_category.item_id = ?';

    const category = new Promise((resolve, reject) => {
      conn.query(categorySql, [item[0].id], (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });

    await category.then((categories) => {
      item[0].categories = categories;
    }).catch((error) => error);

    return item;
  }).then(async (item) => {
    const reviewSql = 'SELECT * FROM reviews WHERE item_id = ?';

    const review = new Promise((resolve, reject) => {
      conn.query(reviewSql, [item[0].id], (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });

    await review.then(async (reviews) => {
      for (let i = 0; i < reviews.length; i++) {
        const revUserSql = 'SELECT name FROM users WHERE id = ?';

        const reviewUser = new Promise((resolve, reject) => {
          conn.query(revUserSql, [reviews[i].user_id], (err, res) => {
            if (err) reject(err);
            resolve(res);
          });
        });

        await reviewUser.then((user) => {
          reviews[i].user = user;
        }).catch((error) => error);
      }

      item[0].reviews = reviews;
    }).catch((error) => error);

    return item;
  })
    .then(async (item) => {
      let suggestSql = 'SELECT items.* FROM items ';
      suggestSql += 'INNER JOIN item_category ON item_category.item_id = items.id ';
      suggestSql += 'WHERE item_category.category_id IN (?) LIMIT 5';

      const suggestArray = [];
      item[0].categories.map((v) => suggestArray.push(v.id));

      const suggest = new Promise((resolve, reject) => {
        conn.query(suggestSql, [suggestArray.join()], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });

      await suggest.then(async (suggests) => {
        const suggestImageSql = 'SELECT filename FROM item_images WHERE item_id = ?';

        for (let i = 0; i < suggests.length; i++) {
          const suggestImage = new Promise((resolve, reject) => {
            conn.query(suggestImageSql, [suggests[i].id], (err, res) => {
              if (err) reject(err);
              resolve(res);
            });
          });

          await suggestImage.then((images) => {
            suggests[i].images = images;
          }).catch((error) => error);
        }

        item[0].suggests = suggests;
      }).catch((error) => error);

      return item;
    })
    .catch((error) => error);
};

const createItem = (data) => {
  const {
    name, price, description, image, category, restaurant_id
  } = data;
  const sql = 'INSERT INTO items(name, price, description, restaurant_id) VALUES(?,?,?,?)';

  return new Promise((resolve, reject) => {
    conn.query(sql, [name, price, description, restaurant_id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  }).then((item) => {
    const categoryArray = category.split(',');
    const catArray = [];
    categoryArray.map((v) => catArray.push(`(${item.insertId}, ${v})`));
    const categorySql = `INSERT INTO item_category(item_id, category_id) VALUES ${catArray.join()}`;

    return new Promise((resolve, reject) => {
      conn.query(categorySql, [], (err, res) => {
        if (err) reject(err);
        resolve(item);
      });
    });
  }).then((item) => {
    const imageArray = [];
    image.map((v) => imageArray.push(`(${item.insertId}, '${v}')`));

    const imageSql = `INSERT INTO item_images(item_id, filename) VALUES ${imageArray.join()}`;

    return new Promise((resolve, reject) => {
      conn.query(imageSql, [], (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }).catch((error) => error);
};

const updateItem = (id, data) => {
  const { name, price, description } = data;
  const sql = 'UPDATE items SET name = ?, price = ?, description = ? WHERE id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [name, price, description, id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  }).then(() => {
    const categoryArray = data.category.split(',');
    const catArray = [];
    categoryArray.map((v) => catArray.push(`(${id}, ${v})`));
    const categorySql = `DELETE FROM item_category WHERE item_id = ?;INSERT INTO item_category(item_id, category_id) VALUES ${catArray.join()}`;

    return new Promise((resolve, reject) => {
      conn.query(categorySql, [id], (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }).then((item) => {
    if (data.image.length > 0) {
      const imgArray = [];
      data.image.map((v) => imgArray.push(`(${id}, '${v}')`));
      const imageSql = `DELETE FROM item_images WHERE item_id = ?;INSERT INTO item_images(item_id, filename) VALUES ${imgArray.join()}`;

      return new Promise((resolve, reject) => {
        conn.query(imageSql, [id, imgArray.join()], (err, res) => {
          if (err) reject(err);
          resolve(res);
        });
      });
    }
    else {
      return item;
    }
  });
};

const deleteItem = (id) => {
  let sql = 'DELETE FROM item_category WHERE item_id = ?;';
  sql += 'DELETE FROM item_images WHERE item_id = ?;';
  sql += 'DELETE FROM items WHERE id = ?;';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id, id, id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  getItemCount,
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
