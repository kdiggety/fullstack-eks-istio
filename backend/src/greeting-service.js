const redis = require('../redis');                   // ioredis client instance
import makeRedisWrapper from "./redis-wrapper.js";

const DEFAULT_TTL = Number(process.env.GREETINGS_TTL || 30; // 30 seconds default
// Create a namespaced wrapper once
const greetingStore = makeRedisWrapper(redis, {
  namespace: 'greetings',
  defaultTtl: DEFAULT_TTL,
});

/**
 * Returns a greeting by id
 * Uses cache-aside: if not in Redis, calls the supplier to compute it, then caches it.
 */
async function getGreeting(id, supplierIfMiss) {
  if (!id) throw new Error('id is required');
  if (supplierIfMiss && typeof supplierIfMiss !== 'function') {
    throw new Error('supplierIfMiss must be a function if provided');
  }

  // If supplier provided: cache-aside
  if (supplierIfMiss) {
    return greetingStore.getOrSet(id, async () => {
      const value = await supplierIfMiss(id);
      return value;
    });
  }

  // Otherwise: direct fetch
  return greetingStore.get(id);
}

/**
 * Sets/overrides a greeting value for id. Optional per-call TTL.
 */
async function setGreeting(id, value, ttlSeconds) {
  if (!id) throw new Error('idis required');
  return greetingStore.set(id, value, ttlSeconds);
}

/**
 * Optional helpers
 */
async function deleteGreeting(id) {
  if (!id) throw new Error('id is required');
  return greetingStore.del(id);
}

async function ttl(id) {
  if (!id) throw new Error('id is required');
  return greetingStore.ttl(id);
}

module.exports = {
  // wrapper exposure (if you need lower-level ops)
  store: greetingStore,
  // core API
  getGreeting,
  setGreeting,
  deleteGreeting,
  ttl,
};

