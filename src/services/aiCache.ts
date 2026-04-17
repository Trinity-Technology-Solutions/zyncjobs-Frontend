// Shared AI response cache with TTL — prevents duplicate API calls
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry { value: any; expires: number; }
const cache = new Map<string, CacheEntry>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.value as T;
}

export function setCached(key: string, value: any, ttl = CACHE_TTL) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

export function cacheKey(...parts: string[]) {
  return parts.join('|');
}
