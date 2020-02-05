const urlParser = (search = null, sort = null, page = 1, perPage = 10) => {
  var pageLinks = '';
  if (search !== null) {
    const arr = [];
    Object.keys(search).map((key) => arr.push(`search[${key}]=${search[key]}`));
    pageLinks += arr.join('&');
    pageLinks += '&';
  }
  if (sort !== null) {
    Object.keys(sort).map((key) => {
      pageLinks += `sort[${key}]=${sort[key]}&`;
    });
  }
  if (page !== null) {
    pageLinks += `page=${page}&`;
  }
  if (perPage !== null) {
    pageLinks += `perPage=${perPage}`;
  }
  return encodeURI(pageLinks);
};

module.exports = urlParser;
