const { User, UserDetails } = require('./models/index');
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

module.exports = {
  getUserById,
  getUsersDataByIds,
  getUserAllData,
  getUserDetails,
};
