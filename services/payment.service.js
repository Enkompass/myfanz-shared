const axios = require('axios');
/**
 * Make payment by request to payment service
 * @param cookie - session cookie
 * @param toUserId -  receiver user id
 * @param amount - payment amount
 * @param description - payment description
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
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
    console.log('makePayment err => ', e.response.data);
    return { success: false, ...e.response.data };
  }
};
