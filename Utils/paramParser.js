/* eslint-disable array-callback-return */
/* eslint-disable no-param-reassign */
const regParam = {
  restaurant_id: 'items.restaurant_id = value',
  maxPrice: 'items.price <= value',
  minPrice: 'items.price >= value',
  category: 'item_category.category_id in (value)',
  rating: '(select AVG(rating) from reviews where reviews.item_id = items.id) <= value and (select AVG(rating) from reviews where reviews.item_id = items.id) >= (value - 1)'
};

const paramParser = (sql, search = null, sort = null, limit = null, where = false, group = null) => {
  if (search !== null) {
    const arr = [];
    Object.keys(search).map((key) => {
      if (search[key] !== '' && search[key] !== null && search[key] !== undefined) {
        const str = regParam[key]
          ? regParam[key].replace('value', search[key])
          : `${key} LIKE '%${search[key]}%'`;
        arr.push(str);
      }
    });
    sql += ` ${where ? 'WHERE' : 'AND'} ${arr.join(' AND ')}`;
  }
  if (group !== null) {
    sql += ` ${group}`;
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
