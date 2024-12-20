const errors = require('./errors');
const errorHandler = require('./middlewares/errorHandler');
const checkPermission = require('./middlewares/checkPermission');
const handleCurrentUser = require('./middlewares/currentUser');
const forbiddenWords = require('./middlewares/forbiddenWords');
const redisWrapper = require('./wrappers/redisWrapper');
const rabbitBroker = require('./wrappers/rabbitBroker');
const helpers = require('./helpers/helpers');
const redisClient = require('./helpers/redisClient');
const userService = require('./services/user.service');
const listService = require('./services/list.service');
const paymentService = require('./services/payment.service');
const creatorBundlesService = require('./services/creatorBundles.service');
const creatorCouplesService = require('./services/creatorCouples.service');

module.exports = {
  ...errors,
  ...errorHandler,
  ...helpers,
  ...userService,
  ...listService,
  ...paymentService,
  ...creatorBundlesService,
  ...creatorCouplesService,
  handleCurrentUser,
  checkPermission,
  forbiddenWords,
  redisWrapper,
  rabbitBroker,
  redisClient,
};
