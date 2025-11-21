import { useState, useEffect } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>();

export function useCache<T>(
  fetcher: () => Promise<T>,
  options: CacheOptions
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (force = false) => {
    const now = Date.now();
    const cached = cache.get(options.key);

    // Check if we have valid cached data
    if (!force && cached && (now - cached.timestamp) < cached.ttl) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      const entry: CacheEntry<T> = {
        data: result,
        timestamp: now,
        ttl: options.ttl || 5 * 60 * 1000, // Default 5 minutes
      };
      cache.set(options.key, entry);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [options.key]);

  const refetch = () => fetchData(true);

  return { data, loading, error, refetch };
}

// Utility function to clear cache
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}