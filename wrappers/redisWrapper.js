const Redis = require('ioredis');

const { ConflictError } = require('../errors');

class RedisWrapper {
  constructor() {
    this._client;
  }

  async connect() {
    console.log('Connecting to Redis...');
    return new Promise((resolve, reject) => {
      const redisClient = new Redis({
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        connectTimeout: 10000,
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log('Redis client created');
      this._client = redisClient;
      redisClient.on('error', (err) => {
        console.error(`Redis connection Error: ${err}`);
        reject(err);
      });
      redisClient.on('ready', () => {
        const info = redisClient.options.name || redisClient.options.host;
        console.info(`Redis connection ready:  ${info}`);
        this._client = redisClient;
        resolve();
      });
      console.log('Redis connection initiated');
    });
  }

  get client() {
    if (!this._client)
      throw new ConflictError(
        'Can`t access to Redis client before connecting!',
        true
      );
    else return this._client;
  }
}

const redisWrapper = new RedisWrapper();

module.exports = redisWrapper;
