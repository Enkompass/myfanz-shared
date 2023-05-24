const axios = require('axios');

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

module.exports.makePayment = async function (
  cookie,
  toUserId,
  amount,
  description
) {
  try {
    const mainAppUrl = process.env.MAIN_APP_URL;
    if (!mainAppUrl)
      return {
        success: false,
        message: 'Main app URL not defined',
      };

    const response = await axios({
      method: 'post',
      url: `${mainAppUrl}/payment-srv/payment/balance`,
      headers: {
        Cookie: cookie, // Pass the active cookie session from the incoming request
        'is-internal': true,
      },
      data: {
        toUserId,
        amount,
        description,
      },
    });
    console.log('response ', response.data);

    return response.data;
  } catch (e) {
    console.log(e.response.data);
    return { success: false, ...e.response.data };
  }
};
