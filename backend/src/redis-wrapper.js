const redisClient = require("./redis-client.js');

// A tiny wrapper around ioredis with JSON helpers, TTL, and namespacing.
const DEFAULT_TTL = null; // seconds; null = no expiry

const buildKey = (ns, key) => {
  return ns ? `${ns}:${key}` : key;
}

const makeRedisWrapper = ({ namespace = "", defaultTtl = DEFAULT_TTL } = {}) => {
  async function ensure() {
    // idempotent connect
    if (typeof redisClient.status === 'string' && redisClient.status !== 'ready') {
      await redisClient.connect().catch(() => {});
    }
  }

  return {
    async set(key, value, ttl = defaultTtl) {
      await ensure();
      const k = buildKey(namespace, key);
      const payload = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl && Number(ttl) > 0) {
        return redisClient.set(k, payload, 'EX', Number(ttl));
      }
      return redisClient.set(k, payload);
    },

    async get(key) {
      await ensure();
      const k = buildKey(namespace, key);
      const raw = await redisClient.get(k);
      if (raw == null) return null;
      try { return JSON.parse(raw); } catch { return raw; }
    },

    async del(key) {
      await ensure();
      const k = buildKey(namespace, key);
      return redisClient.del(k);
    },

    async incr(key) {
      await ensure();
      const k = buildKey(namespace, key);
      return redisClient.incr(k);
    },

    // Optional: get-or-set with supplier (cache-aside)
    async getOrSet(key, supplier, ttl = defaultTtl) {
      const existing = await this.get(key);
      if (existing != null) return existing;
      const fresh = await supplier();
      await this.set(key, fresh, ttl);
      return fresh;
    },

    // Optional: expire/ttl helpers
    async expire(key, seconds) {
      await ensure();
      return redisClient.expire(buildKey(namespace, key), Number(seconds));
    },

    async ttl(key) {
      await ensure();
      return redisClient.ttl(buildKey(namespace, key));
    }
  };
};

module.exports = makeRedisWrapper
