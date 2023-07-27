const axios = require('axios');
const { User, UserDetails, UserSettings } = require('../models/index');
const { Sequelize } = require('sequelize');
const { fetchUsersConnectionsDetails } = require('./list.service');
const { Op } = Sequelize;

/**
 * Get user by id
 * @param id {number} - user id to get
 * @param ignoreHook {boolean} [ignoreHook=false] - if true hooks not affected (does not get avatar and cover images)
 * @param validateFor {number|undefined} [validateFor=undefined] - if passed validated users connections
 * @returns {Promise<Model>}
 */
async function getUserById(id, ignoreHook = false, validateFor = undefined) {
  let user = await User.scope('withId').findOne({
    where: { id },
    ignoreHook,
    raw: true,
  });
  if (validateFor) {
    user = {
      ...user,
      ...(await fetchUsersConnectionsDetails(validateFor, id)),
    };
  }

  return user;
}

/**
 * Get user by filter
 * @param filter {object} - filter to get user
 * @param ignoreHook {boolean} [ignoreHook=false] - if true hooks not affected (does not get avatar and cover images)
 * @param validateFor {number|undefined} [validateFor=undefined] - if passed validated users connections
 * @returns {Promise<Model>}
 */
async function getUserByFilter(
  filter,
  ignoreHook = false,
  validateFor = undefined
) {
  let user = await User.scope('withId').findOne({
    where: filter,
    ignoreHook,
    raw: true,
  });
  if (validateFor) {
    user = {
      ...user,
      ...(await fetchUsersConnectionsDetails(validateFor, user.id)),
    };
  }

  return user;
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
 * Fetch user data with filter
 * @param filter
 * @returns {Promise<any>}
 */
async function fetchUserDataByFilter(filter) {
  return User.scope('withId').findOne({ where: filter, raw: true });
}

/**
 * Get user data by email, returns null if not found
 * @param filter {object} - filter to get user
 * @param scope {'defaultScope'/'withPassword'/'withId'/'withAll'} [scope='defaultScope'] - scope
 * @param raw {boolean} [raw=true] - raw
 * @param ignoreHook {boolean} [ignoreHook=false] - ignoreHook for avatar and cover
 * @returns {Promise<any|null>}
 */
// async function getUserByFilter(
//   filter,
//   scope = 'defaultScope',
//   raw = true,
//   ignoreHook = false
// ) {
//   const user = await User.scope(scope).findOne({
//     where: filter,
//     ignoreHook,
//     include: [
//       {
//         model: UserDetails,
//         as: 'details',
//       },
//     ],
//   });
//
//   if (!user) return null;
//
//   if (raw) return user.dataValues;
//   return user;
// }

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

/**
 * Get user settings
 * @param userId
 * @returns {Promise<any>}
 */
async function getUserSettings(userId) {
  return UserSettings.findOne({
    where: {
      userId,
    },
    raw: true,
  });
}

module.exports = {
  getUserById,
  getUserByFilter,
  getUsersDataByIds,
  getUserAllData,
  getUserDetails,
  makeReport,
  getUserSettings,
  fetchUserDataByFilter,
};
