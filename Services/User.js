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

module.exports = {
  getUsersCount,
  getUsers
};
