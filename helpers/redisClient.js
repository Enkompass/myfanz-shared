const redisWrapper = require('../wrappers/redisWrapper');

/**
 * Get value in redis by key
 * @param key {string} - redis key
 * @returns {Promise<*>}
 */
module.exports.get = async function (key) {
  return redisWrapper.client.get(key);
};

/**
 * Returns all keys matching pattern
 * @param keyPattern {string} - pattern
 * @returns {Promise<Array<string>>}
 */
module.exports.keys = async function (keyPattern) {
  return redisWrapper.client.keys(keyPattern);
};

/**
 * Set data to redis with expire time
 * @param key {string} - redis key
 * @param expireTime {number} - expire time in seconds
 * @param data {any} - data need to set in redis
 * @returns {Promise<*>}
 */
module.exports.setEx = async function (key, expireTime, data) {
  return redisWrapper.client.setex(key, expireTime, data);
};

/**
 * Delete passed key from redis
 * @param key {string/Array<string>} - key need to delete
 * @returns {Promise<*>}
 */
module.exports.del = async function (key) {
  return redisWrapper.client.del(key);
};
