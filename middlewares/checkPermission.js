const { PermissionError } = require('../errors');

/**
 * Middleware to check current signed user permission by permission name
 * throws permission error if not has access, otherwise goes to next middleware
 * @param permissionName {string} - name of permission
 * @returns {function(*, *, *): Promise<*>}
 */
function checkPermission(permissionName) {
  return async function (req, res, next) {
    if (!req.user?.permissions?.includes(permissionName))
      throw new PermissionError('Permission denied');
    return next();
  };
}

module.exports = checkPermission;
