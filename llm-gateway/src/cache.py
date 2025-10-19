import os
from typing import Any, Optional
_redis = None
_cache = {}
async def get_cache():
    global _redis
    try:
        import redis.asyncio as redis
        if _redis is None and (url := os.getenv("REDIS_URL")):
            _redis = redis.from_url(url, decode_responses=True)
        return RedisCache(_redis) if _redis else InMemoryCache()
    except Exception:
        return InMemoryCache()
class InMemoryCache:
    def __init__(self): self.store = _cache
    async def get(self, key: str) -> Optional[Any]: return self.store.get(key)
    async def set(self, key: str, value: Any, ttl: int = 60): self.store[key] = value
class RedisCache:
    def __init__(self, client): self.client = client
    async def get(self, key: str) -> Optional[Any]:
        v = await self.client.get(key)
        return None if v is None else eval(v)
    async def set(self, key: str, value: Any, ttl: int = 60):
        await self.client.setex(key, ttl, repr(value))
