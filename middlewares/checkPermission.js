const { PermissionError } = require('../errors');

/**
 * Middleware to check current signed user permission by permission name
 * throws permission error if not has access, otherwise goes to next middleware
 * @param permission {string|Array<string>} - name of permission(s)
 * @returns {function(*, *, *): Promise<*>}
 */
function checkPermission(permission) {
  return async function (req, res, next) {
    if (!req.user?.permissions) throw new PermissionError('Permission denied');

    if (Array.isArray(permission)) {
      for (let perm of permission) {
        if (req.user.permissions[perm]) return next();
      }
      throw new PermissionError('Permission denied');
    } else if (!req.user.permissions[permission])
      throw new PermissionError('Permission denied');

    return next();
  };
}

module.exports = checkPermission;
