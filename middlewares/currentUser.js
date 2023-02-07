const { NotAuthorizedError } = require('../errors');
const { jsonParser } = require('../helpers/helpers');

function handleCurrentUser(req, res, next) {
  const user = req.headers['x-current-user'];

  if (!user || typeof user !== 'string') return next(new NotAuthorizedError());
  const parsedCurrentUser = jsonParser(user);
  if (typeof parsedCurrentUser != 'object')
    return next(new NotAuthorizedError());
  // console.log('parsedCurrentUser ', parsedCurrentUser);
  req.user = parsedCurrentUser;
  next();
}

module.exports = handleCurrentUser;
