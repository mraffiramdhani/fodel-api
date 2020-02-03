const jwt = require('jsonwebtoken');
const conn = require('./db');
const { response } = require('../Utils');

const auth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const jwtToken = req.headers.authorization.substr(7);
    req.headers.jwt_token = jwtToken;
    conn.execute('select token from revoked_token where token=? and is_revoked=1', [jwtToken], (err, result) => {
      if (err) {
        response(res, 200, false, 'Error.', err);
      }
      else if (result.length > 0) {
        response(res, 200, false, 'Session Expired. Please Log In Again.');
      }
      else {
        try {
          const authData = jwt.verify(jwtToken, process.env.APP_KEY);
          req.auth = authData;
          next();
        }
        catch (e) {
          response(res, 200, false, 'Error.', e);
        }
      }
    });
  }
  else {
    response(res, 200, false, 'Authorization Failed. Please Log In Again.');
  }
};

const hasRole = function HasRole(roles) {
  // eslint-disable-next-line no-param-reassign
  if (roles === 'all') roles = ['customer', 'administrator', 'restaurant'];
  return (req, res, next) => {
    const { role_id } = req.auth;
    conn.execute('select * from roles where id=?', [role_id], (err, result) => {
      if (err) {
        response(res, 200, false, 'Error.', err);
      }
      else if (result.length > 0) {
        if (Array.isArray(roles)) {
          let checked = false;
          let isAuth = false;
          while (!checked) {
            let count = 0;
            for (let i = 0; i < roles.length; i += 1) {
              if (roles[i] === result[0].name) {
                checked = true;
                isAuth = true;
              }
              else {
                count += 1;
              }
            }
            if (count === roles.length) {
              checked = true;
            }
          }
          if (isAuth) {
            next();
          }
          else {
            response(res, 200, false, 'Access Denied. User Role Unidentified.');
          }
        }
        else if (typeof roles === 'string' && roles.toLowerCase() === result[0].name) {
          next();
        }
        else {
          response(res, 200, false, 'Access Denied. User Role Unidentified.');
        }
      }
    });
  };
};

module.exports = { auth, hasRole };
