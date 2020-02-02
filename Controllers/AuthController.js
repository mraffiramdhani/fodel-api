const bcrypt = require('bcryptjs');
const { response, signToken, verifyToken } = require('../Utils');
const { User, Token } = require('../Services');

// eslint-disable-next-line consistent-return
const registerUser = async (req, res) => {
  const { name, username, password } = req.body;
  const fixedRoleId = 3;
  var data = {
    name, username, password, role_id: fixedRoleId
  };

  if (!data.name || !data.username || !data.password) {
    return response(res, 200, false, 'Please provide a valid data.');
  }

  await User.createUser(data).then(async () => {
    const token = signToken({ name, username, role_id: fixedRoleId });
    await Token.putToken({ token }).then(() => response(res, 200, true, 'User Created Successfully.', { token, name, username })).catch((error) => response(res, 200, false, 'Error', error));
  }).catch((error) => response(res, 200, false, 'Error.', error));
};

const checkToken = async (req, res) => {
  const { token } = req.body;
  await Token.isRevoked(token).then((data) => {
    const auth = verifyToken(token);
    if (data.length === 0) {
      if (auth.role_id === 1) {
        return response(res, 200, true, 'Authentication Success.', {
          role: 'administrator',
          name: auth.name
        });
      }
      if (auth.role_id === 2) {
        return response(res, 200, true, 'Authentication Success.', {
          role: 'restaurant',
          name: auth.name
        });
      }
      if (auth.role_id === 3) {
        return response(res, 200, true, 'Authentication Success.', {
          role: 'customer',
          name: auth.name
        });
      }
    }
    else {
      return response(res, 200, true, 'Session Expired. Please Login Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error.', error));
};

// eslint-disable-next-line consistent-return
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return response(res, 200, false, 'Please Provide a Valid Data.');
  }

  const user = await User.getUserByUsername(username);
  if (user.length > 0) {
    if (bcrypt.compareSync(password, user[0].password)) {
      // eslint-disable-next-line camelcase
      const { id, name, role_id } = user[0];
      const token = signToken({
        id, name, username, role_id
      });
      Token.putToken({ token }).then(() => response(res, 200, true, 'User Logged In Successfuly.', { token, name, username })).catch((error) => response(res, 200, false, 'Error At Storing Token.', error));
    }
    else {
      return response(res, 200, false, 'Invalid Password.');
    }
  }
  else {
    return response(res, 200, false, 'User Not Found.');
  }
};

const logoutUser = async (req, res) => {
  Token.revokeToken(req.headers.jwt_token).then(() => response(res, 200, true, 'User Logged Out Successfuly.')).catch((error) => response(res, 200, false, 'Error At Revoking Token.', error));
};

module.exports = {
  registerUser,
  checkToken,
  loginUser,
  logoutUser
};
