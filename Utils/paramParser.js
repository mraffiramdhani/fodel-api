const paramParser = (sql, search = null, sort = null) => {
  if (search) {
    const arr = [];
    Object.keys(search).map((key) => arr.push(`${key} LIKE '%${search[key]}%'`));
    sql.concat(arr.join(' AND '));
  }
  if (sort) {
    Object.keys(sort).map((key) => sql.concat(` ORDER BY ${key} ${sort[key]}`));
  }
  return sql;
};

module.exports = paramParser;
