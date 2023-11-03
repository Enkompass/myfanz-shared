const axios = require('axios');
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
    const mainAppUrl = process.env.MAIN_APP_URL;
    if (!mainAppUrl)
      return {
        success: false,
        message: 'Main app URL not defined',
      };

    const response = await axios({
      method: 'post',
      url: `${mainAppUrl}/payment-srv/payment`,
      headers: {
        Cookie: cookie, // Pass the active cookie session from the incoming request
        'is-internal': true,
      },
      data: {
        toUserId,
        amount,
        itemId,
        type,
        message,
        cardId,
      },
    });
    console.log('response ', response.data);

    return response.data;
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
