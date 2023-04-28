const { User, UserDetails } = require('../models/index');
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;

async function getUserById(id, ignoreHook = false) {
  return User.findOne({ where: { id }, ignoreHook });
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

module.exports = {
  getUserById,
  getUsersDataByIds,
  getUserAllData,
  getUserDetails,
  getUserByFilter,
};
