const regParam = {
  maxPrice: 'cost <= value',
  minPrice: 'cost >= value',
  city_id: 'city_id = value',
  province_id: 'province_id = value'
};

const paramParser = (sql, search = null, sort = null, limit = null, where = false) => {
  if (search !== null) {
    const arr = [];
    Object.keys(search).map((key) => {
      if(search[key] !== '' && search[key] !== null && search[key] !== undefined){
        let str = regParam[key]
        ? regParam[key].replace('value', search[key])
        : `${key} LIKE '%${search[key]}%'`;
        arr.push(str);
      }
    });
    sql += ` ${where ? 'WHERE' : 'AND'} ` + arr.join(' AND ');
  }
  if (sort !== null) {
    Object.keys(sort).map((key) => {
      sql += ` ORDER BY ${key} ${sort[key]}`;
    });
  }
  if (limit !== null) {
    sql += ` LIMIT ${limit}`;
  }
  return sql;
};

module.exports = paramParser;
