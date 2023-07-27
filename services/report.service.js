const { ReportedUsers } = require('./../models');

/**
 * Fetch reported user from passed user
 * @param userId {number} - user id of reporter
 * @param reportedUser {number} - reported user id
 * @returns {Promise<Model>}
 */
async function fetchReportedUser(userId, reportedUser) {
  return ReportedUsers.findOne({
    where: { userId: reportedUser, byUserId: userId },
  });
}

module.exports = {
  fetchReportedUser,
};
