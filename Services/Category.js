const conn = require('./db');
const { paramParser } = require('../Utils');

const getCategoryCount = (search, sort) => {
  const sql = 'SELECT COUNT(*) as count FROM categories';
  const parsedSql = paramParser(sql, search, sort, null, true);

  return new Promise((resolve, reject) => {
    conn.query(parsedSql, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getCategories = (search, sort, limit) => {
  const sql = 'SELECT * FROM categories';
  const parsedSql = paramParser(sql, search, sort, limit, true);

  return new Promise((resolve, reject) => {
    conn.query(parsedSql, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getCategory = (id) => {
  const sql = 'SELECT * FROM categories WHERE id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const createCategory = (data) => {
  const { name, icon } = data;
  const sql = 'INSERT INTO categories(name, icon) VALUES(?,?)';

  return new Promise((resolve, reject) => {
    conn.query(sql, [name, icon], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const updateCategory = (id, data) => {
  const sql = 'UPDATE categories SET ? WHERE id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [data, id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const deleteCategory = (id) => {
  const sql = 'DELETE FROM categories WHERE id = ?';

  return new Promise((resolve, reject) => {
    conn.query(sql, [id], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  getCategoryCount,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
