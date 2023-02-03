const userRoles = [
    {id: 1, role: 'user'},
    {id: 2, role: 'member'},
    {id: 3, role: 'creator'},
    {id: 4, role: 'admin'},
]

/**
 * Get role id by role name
 * @param role {'user' | 'member' | 'creator' | 'admin' } - role name
 * @returns {number}
 */
module.exports.getRoleId = function (role) {
    return userRoles.find(el => el.role === role)?.id;
}

/**
 * Return parsed from json data if data valid, otherwise return null (not crushed)
 * @param arg
 * @returns {any|null}
 */
module.exports.jsonParser = function (arg) {
    try {
        return JSON.parse(arg);
    } catch (e) {
        console.error('jsonParser error => ', e.message);
        return null;
    }
};

