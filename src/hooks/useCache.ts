import { useState, useEffect, useCallback, useRef } from 'react';

// Cache configuration
interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of entries (default: 100)
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

// Cache store
class CacheStore {
  private cache = new Map<string, CacheEntry<any>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes
      maxSize: config.maxSize || 100,
      staleWhileRevalidate: config.staleWhileRevalidate ?? true
    };
  }

  set<T>(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > this.config.ttl;

    if (isExpired) {
      if (this.config.staleWhileRevalidate) {
        // Mark as stale but return data
        entry.isStale = true;
        return entry;
      } else {
        // Remove expired entry
        this.cache.delete(key);
        return null;
      }
    }

    return entry;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new CacheStore();

// Hook for caching API calls
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = globalCache.get<T>(key);
        if (cached) {
          setData(cached.data);
          setIsStale(cached.isStale);
          
          // If data is fresh, don't fetch
          if (!cached.isStale) {
            return cached.data;
          }
          
          // If stale, fetch in background but return stale data immediately
          if (config.staleWhileRevalidate !== false) {
            fetcherRef.current().then(freshData => {
              globalCache.set(key, freshData);
              setData(freshData);
              setIsStale(false);
            }).catch(console.error);
            
            return cached.data;
          }
        }
      }
      
      setLoading(true);
      const freshData = await fetcherRef.current();
      
      globalCache.set(key, freshData);
      setData(freshData);
      setIsStale(false);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, config.staleWhileRevalidate]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate cache for this key
  const invalidate = useCallback(() => {
    globalCache.invalidate(key);
    setData(null);
    setIsStale(false);
  }, [key]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate
  };
}

// Hook for managing cache globally
export function useCacheManager() {
  const invalidatePattern = useCallback((pattern: string) => {
    globalCache.invalidatePattern(pattern);
  }, []);

  const clearCache = useCallback(() => {
    globalCache.clear();
  }, []);

  const getCacheSize = useCallback(() => {
    return globalCache.size();
  }, []);

  const invalidateKey = useCallback((key: string) => {
    globalCache.invalidate(key);
  }, []);

  const getStats = useCallback(() => {
    return {
      hits: 0, // Simplified stats for now
      misses: 0,
      size: globalCache.size()
    };
  }, []);

  return {
    invalidatePattern,
    clearCache,
    getCacheSize,
    invalidateKey,
    getStats
  };
}

// Utility function to create cache keys
export function createCacheKey(base: string, params?: Record<string, any>): string {
  if (!params) return base;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
    
  return `${base}?${sortedParams}`;
}

// Pre-configured cache hooks for common use cases
export function useUsersCache(params?: any) {
  const key = createCacheKey('users', params);
  return useCache(key, () => {
    // This would be replaced with actual API call
    throw new Error('Fetcher function must be provided');
  });
}

export function useBookingsCache(params?: any) {
  const key = createCacheKey('bookings', params);
  return useCache(key, () => {
    throw new Error('Fetcher function must be provided');
  });
}

export function useTransactionsCache(params?: any) {
  const key = createCacheKey('transactions', params);
  return useCache(key, () => {
    throw new Error('Fetcher function must be provided');
  });
}

// Cache invalidation helpers
export const cacheInvalidators = {
  // Invalidate all user-related cache
  users: () => globalCache.invalidatePattern('^users'),
  
  // Invalidate specific user cache
  user: (userId: string) => globalCache.invalidatePattern(`^users.*${userId}`),
  
  // Invalidate all booking-related cache
  bookings: () => globalCache.invalidatePattern('^bookings'),
  
  // Invalidate specific booking cache
  booking: (bookingId: string) => globalCache.invalidatePattern(`^bookings.*${bookingId}`),
  
  // Invalidate all transaction-related cache
  transactions: () => globalCache.invalidatePattern('^transactions'),
  
  // Invalidate analytics cache
  analytics: () => globalCache.invalidatePattern('^analytics'),
  
  // Invalidate settings cache
  settings: () => globalCache.invalidatePattern('^settings')
};

export default useCache;