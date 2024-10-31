const {
  makeAuthorizedRequest,
  getCSRFTokenFromCookie,
} = require('../helpers/helpers');

/**
 * Make payment by request to payment service
 * @param cookie - session cookie
 * @param toUserId {number} -  receiver user id
 * @param amount {number} - payment amount
 * @param itemId {string} - payment item id
 * @param type {'tip'|'post_tip'|'message_tip'|'stream_tip'|'story_tip'|'unlock_post'|'message_unlock'|'subscribe'|'unlock_stream'} - payment type
 * @param message {string} - payment description
 * @param cardId {number} - card id
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
module.exports.makePayment = async function (
  cookie,
  toUserId,
  amount,
  itemId,
  type,
  message,
  cardId
) {
  try {
    const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
    return await makeAuthorizedRequest(cookie, {
      url: '/payment-srv/payment',
      method: 'POST',
      data: {
        toUserId,
        amount,
        itemId,
        type,
        message,
        cardId,
      },
      headers: {
        'X-Csrf-Token': csrfCleanToken,
      },
    });
  } catch (e) {
    console.log('makePayment err => ', e.response.data);
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
 * Fetch user balance by request to payment service
 * @param cookie - session cookie
 * @param userId {number} -  user id
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
module.exports.fetchUserBalance = async function (cookie, userId) {
  try {
    const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
    const response = await makeAuthorizedRequest(
      cookie,
      {
        url: `/payment-srv/balance/${userId}`,
        method: 'GET',
        headers: {
          'X-Csrf-Token': csrfCleanToken,
        },
      },
      true
    );

    return response?.data;
  } catch (e) {
    console.log('makePayment err => ', e.response.data);
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

module.exports.fetchUserCreatorApprovals = async function (cookie, userId) {
  try {
    const { csrfCleanToken } = getCSRFTokenFromCookie(cookie);
    const response = await makeAuthorizedRequest(
      cookie,
      {
        url: `/payment-srv/creator-approval/admin/forUser/${userId}`,
        method: 'GET',
        headers: {
          'X-Csrf-Token': csrfCleanToken,
        },
      },
      true
    );

    return response?.data;
  } catch (e) {
    console.log('makePayment err => ', e.response.data);
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
