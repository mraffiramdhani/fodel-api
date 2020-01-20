/* eslint-disable camelcase */
const conn = require('./db');

const putToken = (data) => {
  const { token, is_revoked } = data;
  const sql = 'INSERT INTO revoked_token(token, is_revoked) VALUES(?,?)';
  return new Promise((resolve, reject) => {
    conn.query(sql, [token, is_revoked], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const isRevoked = (token) => {
  const sql = 'SELECT * FROM revoked_token WHERE token = ? AND is_revoked = 1';
  return new Promise((resolve, reject) => {
    conn.query(sql, [token], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

const revokeToken = (token) => {
  const sql = 'UPDATE revoked_token SET is_revoked = 1 WHERE token = ?';
  return new Promise((resolve, reject) => {
    conn.query(sql, [token], (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
};

module.exports = {
  putToken,
  isRevoked,
  revokeToken
};
