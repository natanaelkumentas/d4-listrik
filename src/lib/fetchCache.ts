/**
 * Client-side in-memory fetch cache.
 * - `cachedFetch(url)` returns cached data if available and not expired, otherwise fetches.
 * - `invalidateCache(urlPrefix)` clears cache entries matching a URL prefix.
 * - TTL defaults to 5 minutes.
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch JSON from a URL with caching.
 * Returns cached data if still valid, otherwise makes a network request.
 */
export async function cachedFetch<T = unknown>(url: string, ttl = DEFAULT_TTL): Promise<T> {
  // Return from cache if valid
  const entry = cache.get(url);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data as T;
  }

  // Deduplicate concurrent requests to the same URL
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const promise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data as T;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, promise);
  return promise;
}

/**
 * Invalidate all cache entries whose URL starts with the given prefix.
 * Call this after POST/PUT/DELETE mutations.
 *
 * Example: `invalidateCache("/api/dosen")` clears `/api/dosen` and `/api/dosen?...`
 */
export function invalidateCache(urlPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearAllCache() {
  cache.clear();
}
