const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_LIMIT = 0; // in mongodb, if we set 0 as the page limit, it will return all the documents in the collection

function getPagination(query) {
  const page = Math.abs(query.page) || DEFAULT_PAGE_NUMBER; // if query.page is not defined, use 1
  const limit = Math.abs(query.limit) || DEFAULT_PAGE_LIMIT; // if query.page is not set(null), we return all the documents
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
  };
}

module.exports = {
  getPagination,
};
