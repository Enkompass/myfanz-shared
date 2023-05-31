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
  const limit = query?.limit || 10;
  return {
    limit,
    page: query?.page * limit || 0,
  };
};
