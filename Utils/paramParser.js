const paramParser = (sql, search = null, sort = null) => {
  if (search !== null) {
    const arr = [];
    Object.keys(search).map((key) => arr.push(`${key} LIKE '%${search[key]}%'`));
    sql += arr.join(' AND ');
  }
  if (sort !== null) {
    Object.keys(sort).map((key) => {
      sql += ` ORDER BY ${key} ${sort[key]}`;
    });
  }
  return sql;
};

module.exports = paramParser;
