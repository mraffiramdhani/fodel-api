const bcrypt = require('bcryptjs');
const conn = require('./db');
const { paramParser } = require('../Utils');

const getUsersCount = (exceptionId, searchParams = null, sortParams = null) => {
  const sql = `SELECT COUNT(*) AS count FROM users WHERE id != ${exceptionId} ${searchParams !== null ? ' AND ' : ''}`;
  const parsedSQL = paramParser(sql, searchParams, sortParams);

  return new Promise((resolve, reject) => {
    conn.query(parsedSQL, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getUsers = (exceptionId, searchParams = null, sortParams = null, limitParams = '0,10') => {
  const sql = `SELECT * FROM users WHERE id != ${exceptionId} ${searchParams !== null ? ' AND ' : ''}`;
  const parsedSQL = paramParser(sql, searchParams, sortParams);

  return new Promise((resolve, reject) => {
    const sqlStr = parsedSQL.concat(` LIMIT ${limitParams}`);
    conn.query(sqlStr, [], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getUserById = (userId) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getUserByUsername = (username) => {
  const sql = 'SELECT * FROM users WHERE username = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [username], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const getUsersByRole = (roleId) => {
  const sql = 'SELECT * FROM users WHERE role_id = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [roleId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const createUser = (data) => {
  const {
    name, username, password, role_id
  } = data;
  const encPass = bcrypt.hashSync(password);
  const sql = 'INSERT INTO users(name, username, password, role_id) VALUES(?,?,?,?)';
  return new Promise((resolve, reject) => {
    conn.query(sql, [name, username, encPass, role_id],
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
  });
};

const updateUser = (userId, data) => {
  var user = data;
  const sql = 'UPDATE users SET ? WHERE id=?';
  if (user.password) {
    const encPass = bcrypt.hashSync(user.password);
    user.password = encPass;
  }
  return new Promise((resolve, reject) => {
    conn.query(sql,
      [user, userId],
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
  });
};

const deleteUser = (userId) => {
  const sql = 'DELETE FROM users WHERE id=?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [userId], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  getUsersCount,
  getUsers,
  getUserById,
  getUserByUsername,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser
};
