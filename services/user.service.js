const axios = require('axios');
const { User, UserDetails } = require('../models/index');
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;

async function getUserById(id, ignoreHook = false) {
  return User.findOne({ where: { id }, ignoreHook });

  // if (user) {
  //   user = user.dataValues;
  //   user.lastActivity = session.lastActivity;
  // }

  // return user;
}
async function getUsersDataByIds(userIds) {
  return User.findAll({
    where: { id: { [Op.in]: userIds } },
    // include: [{ model: UserDetails, attributes: ['location'] }],
    raw: true,
  });
}

async function getUserAllData(userId, ignoreHook = false) {
  return User.findOne({
    where: { id: userId },
    include: [{ model: UserDetails, as: 'details' }],
    raw: true,
    ignoreHook,
  });
}

async function getUserDetails(userId) {
  return UserDetails.findOne({ where: { userId }, raw: true });
}

/**
 * Get user data by email, returns null if not found
 * @param filter {object} - filter to get user
 * @param scope {'defaultScope'/'withPassword'/'withId'/'withAll'} [scope='defaultScope'] - scope
 * @param raw {boolean} [raw=true] - raw
 * @param ignoreHook {boolean} [ignoreHook=false] - ignoreHook for avatar and cover
 * @returns {Promise<any|null>}
 */
async function getUserByFilter(
  filter,
  scope = 'defaultScope',
  raw = true,
  ignoreHook = false
) {
  const user = await User.scope(scope).findOne({
    where: filter,
    ignoreHook,
    include: [
      {
        model: UserDetails,
        as: 'details',
      },
    ],
  });

  if (!user) return null;

  if (raw) return user.dataValues;
  return user;
}

/**
 * Make report by request to main api service
 * @param cookie - session cookie
 * @param reportedUser -  reported user id
 * @param typeId - report type
 * @param message - report message
 * @param itemType - reported item type
 * @param itemId - reported item id
 * @param itemUrl - reported item URL
 * @returns {Promise<(*&{success: boolean})|*|{success: boolean, message: string}>}
 */
async function makeReport(
  cookie,
  reportedUser,
  typeId,
  message,
  itemType,
  itemId,
  itemUrl
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
      url: `${mainAppUrl}/report`,
      headers: {
        Cookie: cookie, // Pass the active cookie session from the incoming request
        'is-internal': true,
      },
      data: {
        reportedUser,
        typeId,
        message,
        itemType,
        itemId,
        itemUrl,
      },
    });
    console.log('response ', response.data);

    return response.data;
  } catch (e) {
    console.log('makeReport err => ', e.response.data);
    return { success: false, ...e.response.data };
  }
}

module.exports = {
  getUserById,
  getUsersDataByIds,
  getUserAllData,
  getUserDetails,
  getUserByFilter,
  makeReport,
};
