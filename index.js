const errors = require('./errors');
const errorHandler = require('./middlewares/errorHandler');
const checkPermission = require('./middlewares/checkPermission');
const handleCurrentUser = require('./middlewares/currentUser');
const redisWrapper = require('./wrappers/redisWrapper');
const rabbitBroker = require('./wrappers/rabbitBroker');
const helpers = require('./helpers/helpers');
const redisClient = require('./helpers/redisClient');
const userService = require('./userService/userService');

module.exports = {
  ...errors,
  ...errorHandler,
  ...helpers,
  ...userService,
  handleCurrentUser,
  checkPermission,
  redisWrapper,
  rabbitBroker,
  redisClient,
};
