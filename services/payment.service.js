const axios = require('axios');
/**
 * Make payment by request to payment service
 * @param cookie - session cookie
 * @param toUserId {number} -  receiver user id
 * @param amount {number} - payment amount
 * @param description {string} - payment description
 * @param type {'tip'|'post_tip'|'message_tip'|'stream_tip'|'story_tip'|'unlock_post'|'message_unlock'|'subscribe'} - payment description
 * @param message {string} - payment description
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
module.exports.makePayment = async function (
  cookie,
  toUserId,
  amount,
  description,
  type,
  message
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
        type,
        message,
      },
    });
    console.log('response ', response.data);

    return response.data;
  } catch (e) {
    console.log('makePayment err => ', e.response.data);
    return { success: false, ...e.response.data };
  }
};
