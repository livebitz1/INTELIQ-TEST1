// Simple in-memory cache with expiration

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cache = new Map<string, CacheEntry<any>>();

/**
 * Stores data in cache with expiration
 */
export function cacheWithExpiry<T>(key: string, data: T, ttlMs: number): void {
  const expiry = Date.now() + ttlMs;
  cache.set(key, { data, expiry });
  
  // Schedule cleanup of expired item
  setTimeout(() => {
    const entry = cache.get(key);
    if (entry && entry.expiry <= Date.now()) {
      cache.delete(key);
    }
  }, ttlMs);
}

/**
 * Retrieves cached data if not expired
 */
export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (entry.expiry <= Date.now()) {
    // Expired
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Clears specific cache key or entire cache
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number, keys: string[] } {
  // Clean expired entries first
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry <= now) {
      cache.delete(key);
    }
  }
  
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
