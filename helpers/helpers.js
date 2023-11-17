const validUrl = require('valid-url');
const axios = require('axios');
const crypto = require('crypto');
const { ConflictError } = require('../errors');

const userRoles = [
  { id: 1, role: 'user' },
  { id: 2, role: 'member' },
  { id: 3, role: 'creator' },
  { id: 4, role: 'admin' },
];

/**
 * Get role id by role name
 * @param role {'user' | 'member' | 'creator' | 'admin' } - role name
 * @returns {number}
 */
module.exports.getRoleId = function (role) {
  return userRoles.find((el) => el.role === role)?.id;
};

/**
 * Get role by role id
 * @param roleId {number } - role id
 * @returns {'user' | 'member' | 'creator' | 'admin'}
 */
module.exports.getRoleFromId = function (roleId) {
  return userRoles.find((el) => el.id === roleId)?.role;
};

/**
 * Return parsed from json data if data valid, otherwise return null (not crushed)
 * @param arg
 * @returns {any|null}
 */
module.exports.jsonParser = function (arg) {
  try {
    return JSON.parse(arg);
  } catch (e) {
    console.error('jsonParser error => ', e.message);
    return null;
  }
};

/**
 * Capitalize first letter of string from argument and retrun it
 * @param str
 * @returns {string}
 */
module.exports.capitalizeFirstLetter = function (str) {
  if (typeof str !== 'string') {
    throw new ConflictError('Expected a string');
  }

  if (str.length === 0) {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert query params
 * @param query
 * @returns {{limit: (*|number), page: (number|number)}}
 */
exports.getQueryParams = (query) => {
  const limit = query?.limit ? Number(query.limit) : 10;
  return {
    ...query,
    limit,
    page: (query?.page ? Number(query.page) : 0) * limit,
  };
};

/**
 * Convert query params
 * @param query
 * @returns {{limit: (*|number), page: (number|number)}}
 */
exports.convertQueryParams = (query) => {
  if (!query) query = {};
  let { limit, page } = query;
  limit = Number(limit) || 10;
  page = Number(page) || 1;

  return {
    filter: query?.filter,
    page,
    limit,
    skip: page * limit,
    customLabels: {
      totalDocs: 'totalCount',
      docs: 'items',
      limit: 'perPage',
      page: 'currentPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
      totalPages: 'totalPages',
      pagingCounter: 'pagingCounter',
      meta: 'paginate',
    },
  };
};

/**
 * Convert query params for postgre
 * @param query
 * @returns {{limit: (*|number), page: (number|number)}}
 */
exports.convertQueryParamsPg = (query) => {
  if (!query) query = {};
  let { limit, page } = query;
  limit = Number(limit) || 10;
  page = Number(page) || 1;
  const offset = (page - 1) * limit;

  return {
    ...query,
    page,
    limit,
    offset,
  };
};

/**
 * Paginate Postgre query in sequelize
 * @param model - Model
 * @param options - query options
 * @param query - query params
 * @returns {Promise<{paginate: {hasPrevPage: boolean, perPage: number | number, hasNextPage: boolean, pagingCounter: number, nextPage: (*|null), totalPages: number, prevPage: (number|null), totalCount: *, currentPage: number | number}, items: *}>}
 */
exports.paginatePg = async function (model, options, query) {
  if (!query) query = {};
  let { limit, page } = query;
  limit = Number(limit) || 10;
  page = Number(page) || 1;
  const offset = (page - 1) * limit;

  const { count, rows } = await model.findAndCountAll({
    ...options,
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);

  return {
    items: rows,
    paginate: {
      totalCount: count,
      perPage: limit,
      totalPages,
      currentPage: page,
      pagingCounter: (page - 1) * limit + 1,
      hasPrevPage: page !== 1,
      hasNextPage: totalPages > page,
      prevPage: page !== 1 ? page - 1 : null,
      nextPage: totalPages > page ? page + 1 : null,
    },
  };
};

/**
 * Make authorized internal request
 * @param cookie - cookie session
 * @param options {axios.AxiosRequestConfig}
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
exports.makeAuthorizedRequest = async function (cookie, options) {
  if (!options) throw new ConflictError('Invalid request options');

  try {
    const mainAppUrl = process.env.MAIN_APP_URL;

    if (!mainAppUrl)
      return {
        success: false,
        message: 'Main app URL not defined',
      };
    let headers = {
      Cookie: cookie, // Pass the active cookie session from the incoming request
      'is-internal': true,
    };

    if (options.headers) headers = { ...options.headers, ...headers };
    if (!options.method) options.method = 'get';

    const response = await axios({
      ...options,
      url: mainAppUrl + options.url,
      headers,
    });
    console.log('makeAuthorizedRequest response ', response.data);

    return response.data;
  } catch (e) {
    console.log('makeAuthorizedRequest err => ', e.response.data);
    const errData = {
      success: false,
      ...e.response.data,
    };

    if (errData.errors) {
      const key = Object.keys(errData.errors)[0];
      errData.message = `${key}-${errData.errors[key]}`;
    }
    return errData;
  }
};

/**
 * Generate random hex string (string length equal size*2)
 * @param size {number} - size in bytes
 * @returns {string}
 */
exports.generateRandomToken = (size = 48) => {
  return crypto.randomBytes(size).toString('hex');
};

/**
 * Generate hash by hash algorithm
 * @param val {string} - value need to encode
 * @param algorithm {string} [algorithm='md5'] - hash algorithm
 * @returns {string}
 */
exports.generateHash = (val, algorithm = 'md5') => {
  return crypto.createHash(algorithm).update(String(val)).digest('hex');
};

/**
 * Check value is valid URL
 * @param val
 * @returns {string}
 */
exports.isValidUrl = (val) => validUrl.isUri(val);
