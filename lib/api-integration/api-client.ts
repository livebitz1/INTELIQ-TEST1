import { cacheWithExpiry, getCachedData } from './cache-manager';

// Base configuration for API requests with retry logic
export async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = 3, 
  cacheKey?: string, 
  cacheDuration = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Check cache first if cacheKey provided
  if (cacheKey) {
    const cachedData = getCachedData<T>(cacheKey);
    if (cachedData) return cachedData;
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add standard headers and options
      const fetchOptions = {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        }
      };
      
      const response = await fetch(url, fetchOptions);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        console.warn(`Rate limited by API. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as T;
      
      // Store successful result in cache if cacheKey provided
      if (cacheKey) {
        cacheWithExpiry(cacheKey, data, cacheDuration);
      }
      
      return data;
    } catch (error: any) {
      lastError = error;
      
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`API request failed. Attempt ${attempt + 1}/${retries}. Retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("API request failed after multiple retries");
}

// Helper for common API requests
export const apiClient = {
  get: <T>(url: string, cacheKey?: string, cacheDuration?: number) => 
    fetchWithRetry<T>(url, { method: 'GET' }, 3, cacheKey, cacheDuration),
    
  post: <T>(url: string, body: any, cacheKey?: string, cacheDuration?: number) => 
    fetchWithRetry<T>(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) 
    }, 3, cacheKey, cacheDuration),
};
