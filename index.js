const errors = require('./errors');
const errorHandler = require('./middlewares/errorHandler');
const checkPermission = require('./middlewares/checkPermission');
const redisWrapper = require('./wrappers/redisWrapper');
const rabbitBroker = require('./wrappers/rabbitBroker');
const redisClient = require('./helpers/redisClient');

module.exports = {
    ...errors,
    ...errorHandler,
    checkPermission,
    redisWrapper,
    rabbitBroker,
    redisClient
}
