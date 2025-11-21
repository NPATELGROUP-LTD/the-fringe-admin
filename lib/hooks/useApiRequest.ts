import { useState, useCallback, useRef, useEffect } from 'react';

// Request states
export type RequestState = 'idle' | 'loading' | 'success' | 'error';

// API request options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTime?: number;
}

// API response type
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  loading: boolean;
  state: RequestState;
}

// Cache entry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache
class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

// Request deduplication
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  get<T>(key: string): Promise<T> | null {
    return this.pendingRequests.get(key) || null;
  }

  set<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);

    // Clean up after promise resolves
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

const requestDeduplicator = new RequestDeduplicator();

// Generate cache key from URL and options
function generateCacheKey(url: string, options: ApiRequestOptions): string {
  const { method = 'GET', body } = options;
  const bodyStr = body ? JSON.stringify(body) : '';
  return `${method}:${url}:${bodyStr}`;
}

// Main hook
export function useApiRequest<T = any>() {
  const [response, setResponse] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
    state: 'idle',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel current request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Make API request
  const request = useCallback(async (
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<T | null> => {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      retries = 0,
      cache = false,
      cacheTime = 5 * 60 * 1000,
    } = options;

    const cacheKey = generateCacheKey(url, options);

    // Check cache first
    if (cache && method === 'GET') {
      const cachedData = apiCache.get<T>(cacheKey);
      if (cachedData !== null) {
        setResponse({
          data: cachedData,
          error: null,
          loading: false,
          state: 'success',
        });
        return cachedData;
      }
    }

    // Check for duplicate requests
    const existingRequest = requestDeduplicator.get<T>(cacheKey);
    if (existingRequest) {
      try {
        const data = await existingRequest;
        setResponse({
          data,
          error: null,
          loading: false,
          state: 'success',
        });
        return data;
      } catch (error) {
        // Continue with new request if deduplicated request failed
      }
    }

    // Cancel previous request
    cancel();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setResponse(prev => ({
      ...prev,
      loading: true,
      state: 'loading',
      error: null,
    }));

    const makeRequest = async (attempt: number = 0): Promise<T> => {
      try {
        const requestOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: abortControllerRef.current?.signal,
        };

        if (body && method !== 'GET') {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET requests
        if (cache && method === 'GET') {
          apiCache.set(cacheKey, data, cacheTime);
        }

        return data;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error; // Don't retry aborted requests
        }

        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(attempt + 1);
        }

        throw error;
      }
    };

    const requestPromise = makeRequest();

    // Store for deduplication
    requestDeduplicator.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      setResponse({
        data,
        error: null,
        loading: false,
        state: 'success',
      });

      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';

      setResponse({
        data: null,
        error: errorMessage,
        loading: false,
        state: 'error',
      });

      return null;
    }
  }, [cancel]);

  // Reset state
  const reset = useCallback(() => {
    cancel();
    setResponse({
      data: null,
      error: null,
      loading: false,
      state: 'idle',
    });
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...response,
    request,
    cancel,
    reset,
  };
}

// Utility hook for GET requests
export function useApiGet<T = any>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}) {
  const api = useApiRequest<T>();

  useEffect(() => {
    if (url) {
      api.request(url, { ...options, method: 'GET' });
    }
  }, [url]); // Only depend on url to avoid infinite loops

  return api;
}

// Utility hook for mutations (POST, PUT, DELETE)
export function useApiMutation<T = any>() {
  const api = useApiRequest<T>();

  const mutate = useCallback((url: string, options: ApiRequestOptions) => {
    return api.request(url, options);
  }, [api]);

  return {
    ...api,
    mutate,
  };
}