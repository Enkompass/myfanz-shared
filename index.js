const errors = require('./errors');
const errorHandler = require('./middlewares/errorHandler');
const checkPermission = require('./middlewares/checkPermission');
const handleCurrentUser = require('./middlewares/currentUser');
const redisWrapper = require('./wrappers/redisWrapper');
const rabbitBroker = require('./wrappers/rabbitBroker');
const helpers = require('./helpers/helpers');
const redisClient = require('./helpers/redisClient');
const userService = require('./services/user.service');
const listService = require('./services/list.service');

module.exports = {
  ...errors,
  ...errorHandler,
  ...helpers,
  ...userService,
  ...listService,
  handleCurrentUser,
  checkPermission,
  redisWrapper,
  rabbitBroker,
  redisClient,
};
