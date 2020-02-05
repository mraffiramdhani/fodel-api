const bcrypt = require('bcryptjs');

const hashString = (str = '') => {
  return bcrypt.hashSync(str);
};

const compareHashedString = (str = '', comparer = '') => {
  return bcrypt.compareSync(str, comparer);
};

module.exports = {
  hashString,
  compareHashedString
};
