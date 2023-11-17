const axios = require('axios');
const {
  User,
  UserDetails,
  UserSettings,
  Referrals,
} = require('../models/index');
const { Sequelize } = require('sequelize');
const { fetchUsersConnectionsDetails } = require('./list.service');
const { Op } = Sequelize;

/**
 * Get user by id
 * @param id {number} - user id to get
 * @param ignoreHook {boolean} [ignoreHook=false] - if true hooks not affected (does not get avatar and cover images)
 * @param validateFor {number|undefined} [validateFor=undefined] - if passed validated users connections
 * @param attributes {Array<'displayName'|'email'|'username'|'emailVerifiedAt'|'roleId'|'hasCard'|'lastActivity'|'active'|'avatar'|'cover'>} [attributes=undefined] - list of fields need to get, if not passed get all fields
 * @param getAvatar {boolean} [getAvatar=true] - get avatar
 * @param getCover {boolean} [getCover=true] - get cover
 * @param getSmallCover {boolean} [getSmallCover=false] - get small cover
 * @returns {Promise<Model>}
 */
async function getUserById(
  id,
  ignoreHook = false,
  validateFor = undefined,
  attributes = undefined,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  let user = await User.scope('withId').findOne({
    attributes,
    where: { id },
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
    raw: true,
  });
  if (validateFor) {
    user = {
      ...user,
      ...(await fetchUsersConnectionsDetails(id, validateFor)),
    };
  }

  return user;
}

/**
 * Get user by filter
 * @param filter {object} - filter to get user
 * @param ignoreHook {boolean} [ignoreHook=false] - if true hooks not affected (does not get avatar and cover images)
 * @param validateFor {number|undefined} [validateFor=undefined] - if passed validated users connections
 * @param getAvatar {boolean} [getAvatar=true] - get avatar
 * @param getCover {boolean} [getCover=true] - get cover
 * @param getSmallCover {boolean} [getSmallCover=false] - get small cover
 * @returns {Promise<Model>}
 */
async function getUserByFilter(
  filter,
  ignoreHook = false,
  validateFor = undefined,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  let user = await User.scope('withId').findOne({
    where: filter,
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
    raw: true,
  });
  if (validateFor) {
    user = {
      ...user,
      ...(await fetchUsersConnectionsDetails(user.id, validateFor)),
    };
  }

  return user;
}

/**
 * Get users id -es by filter
 * @param filter {object} - filter to get user
 * @returns {Promise<any>}
 */
async function getUsersIdsByFilter(filter) {
  const users =
    (await User.scope('withId').findAll({
      attributes: ['id'],
      where: filter,
      ignoreHook: true,
      raw: true,
    })) || [];

  return users.map((el) => el.id);
}

async function getUsersDataByIds(userIds) {
  return User.scope('withId').findAll({
    where: { id: { [Op.in]: userIds } },
    // include: [{ model: UserDetails, attributes: ['location'] }],
    raw: true,
  });
}

async function getUserAllData(
  userId,
  ignoreHook = false,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  return User.scope('withId').findOne({
    where: { id: userId },
    include: [{ model: UserDetails, as: 'details' }],
    raw: true,
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
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

/**
 * Get user referral
 * @param userId
 * @returns {Promise<any>}
 */
async function getUserReferral(userId) {
  return Referrals.findOne({
    where: {
      userId,
    },
    raw: true,
  });
}

/**
 * Get user data by username, returns null if not found
 * @param username {string} - username of user
 * @param scope {'defaultScope'/'withPassword'/'withId'/'withAll'} [scope='defaultScope'] - scope
 * @param raw {boolean} [raw=true] - raw
 * @param ignoreHook {boolean} [ignoreHook=false] - ignoreHook
 * @param getAvatar {boolean} [getAvatar=true] - get avatar
 * @param getCover {boolean} [getCover=true] - get cover
 * @param getSmallCover {boolean} [getSmallCover=false] - get small cover
 * @returns {Promise<any|null>}
 */
async function getUserByUsername(
  username,
  scope = 'defaultScope',
  raw = true,
  ignoreHook = false,
  getAvatar = true,
  getCover = true,
  getSmallCover = false
) {
  const user = await User.scope(scope).findOne({
    where: { username },
    raw,
    ignoreHook,
    getAvatar,
    getCover,
    getSmallCover,
  });

  if (user) return user;
  return null;
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
  getUsersIdsByFilter,
  getUserReferral,
  getUserByUsername,
};
