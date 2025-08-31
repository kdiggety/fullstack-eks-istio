const Redis = require('ioredis');

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_PASSWORD,              // mounted from redis-auth secret
  REDIS_TLS = 'false',         // keep false for Bitnami default
} = process.env;

const opts = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
  lazyConnect: true,           // connect only when you call .connect()
  maxRetriesPerRequest: null,  // avoid unhandled errors during restarts
  enableReadyCheck: true,
};

if (REDIS_TLS === 'true') {
  opts.tls = { rejectUnauthorized: false };
}

const redisClient = new Redis(opts);

// Optional: basic logging
redisClient.on('connect', () => console.log('[redisClient] connecting...'));
redisClient.on('ready',   () => console.log('[redisClient] ready'));
redisClient.on('error',   (e) => console.error('[redisClient] error', e.message));
redisClient.on('end',     () => console.log('[redisClient] connection closed'));

module.exports = redisClient;
