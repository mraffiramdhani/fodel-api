/* eslint-disable consistent-return */
const {
  response, signToken, verifyToken, hashString, compareHashedString, randomString, sendEmail
} = require('../Utils');
const { forgot_password } = require('../Utils/email');
const { User, Token } = require('../Services');

// eslint-disable-next-line consistent-return
const registerUser = async (req, res) => {
  const { name, email, username, password } = req.body;
  const fixedRoleId = 3;
  const encPass = hashString(password);
  var data = {
    name, email, username, password: encPass, role_id: fixedRoleId
  };

  if (!data.name || !data.email || !data.username || !data.password) {
    return response(res, 200, false, 'Please provide a valid data.');
  }

  await User.createUser(data).then(async () => {
    const token = signToken({ name, email, username, role_id: fixedRoleId });
    await Token.putToken({ token }).then(() => response(res, 200, true, 'User Created Successfully.', { token, name, email, username, photo: 'default.png', role: 'customer' })).catch((error) => response(res, 200, false, 'Error', error));
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
    if (compareHashedString(password, user[0].password)) {
      // eslint-disable-next-line camelcase
      const { id, name, email, photo, role_id } = user[0];
      const token = signToken({
        id, name, username, role_id
      });
      let role_name = '';
      if (role_id === 1) {
        role_name = 'administrator';
      }
      else if (role_id === 2) {
        role_name = 'restaurant';
      }
      else if (role_id === 3) {
        role_name = 'customer';
      }
      Token.putToken({ token }).then(() => response(res, 200, true, 'User Logged In Successfuly.', { token, name, email, username, photo, role: role_name })).catch((error) => response(res, 200, false, 'Error At Storing Token.', error));
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

const forgotPassword = async (req, res) => {
  const { username, email } = req.body;
  // eslint-disable-next-line consistent-return
  await User.getUserByUsername(username).then(async (result) => {
    if (result.length > 0) {
      if(result[0].email === email){
        const newPass = randomString(10);
        const payload = {
          to: email,
          subject: 'Reset Password Request Email.',
          html: forgot_password(newPass),
        };
        await sendEmail(payload).then(async (_result) => {
          await User.updateUser(result[0].id, {password: hashString(newPass)}).then((__result) => {
            const { affectedRows } = __result;
            if (affectedRows > 0){
              return response(res, 200, true, 'Password Reset Success.');
            }
            else {
              return response(res, 200, false, 'Password Reset Failed. Please Try Again.');
            }
          }).catch((error) => response(res, 200, false, 'Error At Resetting Password', error));
        }).catch((error) => response(res, 200, false, 'Error At Sending Forgot Password Email.', error));
      }
      else {
        return response(res, 200, false, 'Email not Found.');
      }
    }
    else {
      return response(res, 200, false, 'Username Not Found.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Validating User Username.', error));
};

const getProfile = async (req, res) => {
  const { id } = req.auth;
  await User.getUserById(id).then((result) => {
    if(result.length > 0) {
      return response(res, 200, true, 'Data Found.', result[0]);
    }
    else {
      return response(res, 200, false, 'Fetching User Profile Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Fetching User Profile', error));
};

const updateProfile = async (req, res) => {
  const { id } = req.auth;
  if (req.body.password) {
    const encPass = hashString(req.body.password);
    req.body.password = encPass;
  }
  await User.updateUser(id, req.body).then(async (result) => {
    const { affectedRows } = result;
    if (affectedRows > 0) {
      await User.getUserById(id).then((_result) => {
        if (_result.length > 0) {
          return response(res, 200, true, 'User Updated Successfuly.', _result[0]);
        }
        else {
          return response(res, 200, false, 'Fetching User Data Failed. Please Try Again');
        }
      }).catch((error) => response(res, 200, false, 'Error At Fetching User By ID', error));
    }
    else {
      return response(res, 200, false, 'Updating User Failed. Please Try Again.');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating User', error));
};

const updateProfilePhoto = async (req, res) => {
  const { id } = req.auth;
  const { filename } = req.file;

  await User.updateUser(id, {photo: filename}).then((result) => {
    const { affectedRows } = result;
    if (affectedRows > 0){
      return response(res, 200, true, 'Profile Photo Updated Successfuly', {photo: filename});
    }
    else {
      return response(res, 200, false, 'Updating Profile Photo Failed. Please Try Again');
    }
  }).catch((error) => response(res, 200, false, 'Error At Updating User Profile Photo', error));
};

module.exports = {
  registerUser,
  checkToken,
  loginUser,
  logoutUser,
  forgotPassword,
  getProfile,
  updateProfile,
  updateProfilePhoto
};
