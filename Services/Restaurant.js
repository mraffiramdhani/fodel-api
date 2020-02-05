const conn = require('./db');
const { paramParser } = require('../Utils');

const getRestaurantCount = (search = null, sort = null) => {
  const sql = 'SELECT * FROM restaurants';
  const parsedSQL = paramParser(sql, search, sort, null, true);

  return new Promise((resolve, reject) => {
    conn.query(parsedSQL, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getRestaurants = (search = null, sort = null, limit = '0,10') => {
  const sql = 'SELECT * FROM restaurants';
  const parsedSQL = paramParser(sql, search, sort, limit, true);

  return new Promise((resolve, reject) => {
    conn.query(parsedSQL, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getRestaurant = (id) => {
  const sql = 'SELECT * FROM restaurants WHERE id = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getRestaurantByUser = (userId) => {
  const sql = 'SELECT * FROM restaurants WHERE user_id = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const createRestaurant = (data) => {
  const {
    name, logo, longitude, latitude, description, user_id
  } = data;
  const sql = 'INSERT INTO restaurants(name, logo, longitude, latitude, description, user_id) VALUES(?,?,?,?,?,?)';
  return new Promise((resolve, reject) => {
    conn.query(sql, [name, logo, longitude, latitude, description, user_id],
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
  });
};

const updateRestaurant = (id, data) => {
  const sql = 'UPDATE restaurants SET ? WHERE id=?';
  return new Promise((resolve, reject) => {
    conn.query(sql,
      [data, id],
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
  });
};

const deleteRestaurant = (id) => {
  const sql = 'DELETE FROM restaurants WHERE id = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  getRestaurantCount,
  getRestaurants,
  getRestaurant,
  getRestaurantByUser,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
