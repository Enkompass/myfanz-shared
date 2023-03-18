const { User, UserDetails } = require('./models/index');
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;

async function getUserById(id) {
  return User.findOne({ where: { id } });
}
async function getUsersDataByIds(userIds) {
  return User.findAll({
    where: { id: { [Op.in]: userIds } },
    // include: [{ model: UserDetails, attributes: ['location'] }],
    raw: true,
  });
}

async function getUserAllData(userId) {
  return User.findOne({
    where: { id: userId },
    include: [{ model: UserDetails, as: 'details' }],
    raw: true,
  });
}

module.exports = { getUserById, getUsersDataByIds, getUserAllData };
